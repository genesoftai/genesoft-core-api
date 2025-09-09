import {
    BadRequestException,
    forwardRef,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GithubBranch } from "./entity/github-branch.entity";
import { HttpService } from "@nestjs/axios";
import { GithubConfigurationService } from "../configuration/github";
import { lastValueFrom, of } from "rxjs";
import { catchError, concatMap, map, retry } from "rxjs/operators";
import { AxiosError } from "axios";
import { CreateBranchDto } from "./dto/create-branch.dto";
import { GithubRepository } from "../github/entity/github-repository.entity";
import { CodesandboxService } from "../codesandbox/codesandbox.service";
import { Project } from "../project/entity/project.entity";
import { CollectionService } from "../collection/collection.service";
import { ConversationService } from "../conversation/conversation.service";
import { StartGithubTaskDto } from "./dto/github-task.dto";
import { LlmService } from "../llm/llm.service";
import { GithubService } from "../github/github.service";
import { Iteration } from "../development/entity/iteration.entity";
import { Conversation } from "../conversation/entity/conversation.entity";
import { CreatePRDto } from "./dto/github-pr.dto";
import { GenesoftGithubAgentUsername } from "../constants/github";

@Injectable()
export class GithubManagementService {
    private readonly serviceName: string;
    private readonly githubApiBaseEndpoint: string;

    constructor(
        @InjectRepository(GithubRepository)
        private readonly githubRepositoryRepository: Repository<GithubRepository>,
        @InjectRepository(GithubBranch)
        private readonly githubBranchRepository: Repository<GithubBranch>,
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,
        private readonly githubConfigurationService: GithubConfigurationService,
        private readonly httpService: HttpService,
        private readonly logger: Logger,
        private readonly codesandboxService: CodesandboxService,
        private readonly collectionService: CollectionService,
        private readonly llmService: LlmService,
        private readonly githubService: GithubService,
        @InjectRepository(Iteration)
        private readonly iterationRepository: Repository<Iteration>,
        @InjectRepository(Conversation)
        private readonly conversationRepository: Repository<Conversation>,
        @Inject(forwardRef(() => ConversationService))
        private readonly conversationService: ConversationService,
    ) {
        this.serviceName = GithubManagementService.name;
        this.githubApiBaseEndpoint =
            this.githubConfigurationService.githubBaseApiEndpoint;
    }

    async getAllGithubRepositoriesByOrganizationId(organizationId: string) {
        const projects = await this.projectRepository.find({
            where: {
                organization_id: organizationId,
            },
            order: {
                created_at: "DESC",
            },
        });

        const repositories = await Promise.all(
            projects.map(async (project) => {
                const repository =
                    await this.githubRepositoryRepository.findOne({
                        where: {
                            project_id: project.id,
                        },
                    });

                if (repository) {
                    return repository;
                }

                return null;
            }),
        );

        return repositories.filter((repository) => repository !== null);
    }

    async getGithubRepositoryId(repositoryId: string) {
        const repository = await this.githubRepositoryRepository.findOne({
            where: {
                id: repositoryId,
            },
        });

        const branches = await this.githubBranchRepository.find({
            where: {
                github_repository_id: repositoryId,
            },
        });

        return { ...repository, branches };
    }

    async getGithubRepositoryProjectId(projectId: string) {
        const repository = await this.githubRepositoryRepository.findOne({
            where: {
                project_id: projectId,
            },
        });

        if (!repository) {
            throw new NotFoundException("Repository not found");
        }

        const branches = await this.githubBranchRepository.find({
            where: {
                github_repository_id: repository.id,
            },
        });

        return { ...repository, branches };
    }

    async getGithubRepositoriesByCollectionId(collectionId: string) {
        const collection =
            await this.collectionService.getCollection(collectionId);

        const webProject = collection.web_project;
        const webRepository = await this.githubRepositoryRepository.findOne({
            where: {
                project_id: webProject.id,
            },
        });

        const webBranches = await this.githubBranchRepository.find({
            where: {
                github_repository_id: webRepository.id,
            },
        });

        const backendProjects = collection.backend_service_projects;

        const backendRepositories = await Promise.all(
            backendProjects.map(async (project) => {
                const repository =
                    await this.githubRepositoryRepository.findOne({
                        where: {
                            project_id: project.id,
                        },
                    });

                const branches = await this.githubBranchRepository.find({
                    where: {
                        github_repository_id: repository.id,
                    },
                });

                return { ...repository, branches };
            }),
        );

        return {
            web_repository: { ...webRepository, branches: webBranches },
            backend_repositories: backendRepositories,
        };
    }

    async getBranches(repositoryId: string) {
        const branches = await this.githubBranchRepository.find({
            where: {
                github_repository_id: repositoryId,
            },
            order: {
                created_at: "DESC",
            },
        });

        return branches;
    }

    async getBranch(branchId: string) {
        const branch = await this.githubBranchRepository.findOne({
            where: { id: branchId },
        });

        if (!branch) {
            throw new NotFoundException("Branch not found");
        }

        const repository = await this.githubRepositoryRepository.findOne({
            where: { id: branch.github_repository_id },
        });

        const project = await this.projectRepository.findOne({
            where: { id: repository.project_id },
        });

        return { ...branch, repository, project };
    }

    async getAllBranchesOnGithub(repositoryId: string) {
        const repository = await this.githubRepositoryRepository.findOne({
            where: { id: repositoryId },
        });
        this.logger.log({
            message: `${this.serviceName}.getAllBranchesOnGithub: Repository found`,
            metadata: { repository },
        });

        if (!repository) {
            throw new NotFoundException("Repository not found");
        }

        const token = await this.githubService.getRepoAccessToken(
            repository.owner,
            repository.name,
        );

        this.logger.log({
            message: `${this.serviceName}.getAllBranchesOnGithub: Repo access token URL`,
            metadata: { token },
        });

        const result = await lastValueFrom(
            this.httpService
                .get(
                    `${this.githubApiBaseEndpoint}/repos/${repository.owner}/${repository.name}/branches`,
                    {
                        headers: {
                            Accept: "application/vnd.github+json",
                            Authorization: `Bearer ${token}`,
                            "X-GitHub-Api-Version": "2022-11-28",
                        },
                    },
                )
                .pipe(
                    map((response) => response.data),
                    catchError((error: AxiosError) => {
                        this.logger.error({
                            message: `${this.serviceName}.getAllBranchesOnGithub: Error getting branches`,
                            metadata: { error: error.response?.data },
                        });
                        throw error;
                    }),
                ),
        );

        return result;
    }

    async createNewBranchOnGithub(payload: CreateBranchDto) {
        const { repositoryId, branchName, baseBranch } = payload;

        try {
            const repository = await this.githubRepositoryRepository.findOne({
                where: {
                    id: repositoryId,
                },
            });

            if (!repository) {
                throw new NotFoundException("Repository not found");
            }
            const githubAccessToken =
                await this.githubService.getRepoAccessToken(
                    repository.owner,
                    repository.name,
                );

            // TODO: Get github app access token by organization id

            // Get the SHA of the base branch
            const baseBranchUrl = `${this.githubApiBaseEndpoint}/repos/${repository.owner}/${repository.name}/git/refs/heads/${baseBranch}`;
            const { data: baseBranchData } = await lastValueFrom(
                this.httpService
                    .get(baseBranchUrl, {
                        headers: {
                            Accept: "application/vnd.github+json",
                            Authorization: `Bearer ${githubAccessToken}`,
                            "X-GitHub-Api-Version": "2022-11-28",
                        },
                    })
                    .pipe(
                        catchError((error: AxiosError) => {
                            this.logger.error({
                                message: `${this.serviceName}.createNewBranch: Error getting base branch SHA`,
                                metadata: { error: error.response?.data },
                            });
                            throw error;
                        }),
                    ),
            );

            // Create new branch using the base branch's SHA
            const createBranchUrl = `${this.githubApiBaseEndpoint}/repos/${repository.owner}/${repository.name}/git/refs`;
            const { data } = await lastValueFrom(
                this.httpService
                    .post(
                        createBranchUrl,
                        {
                            ref: `refs/heads/${branchName}`,
                            sha: baseBranchData.object.sha,
                        },
                        {
                            headers: {
                                Accept: "application/vnd.github+json",
                                Authorization: `Bearer ${githubAccessToken}`,
                                "X-GitHub-Api-Version": "2022-11-28",
                            },
                        },
                    )
                    .pipe(
                        catchError((error: AxiosError) => {
                            this.logger.error({
                                message: `${this.serviceName}.createNewBranch: Error creating branch`,
                                metadata: { error: error.response?.data },
                            });
                            throw error;
                        }),
                    ),
            );

            this.logger.log({
                message: `${this.serviceName}.createNewBranch: Successfully created branch`,
                metadata: { data },
            });

            return data;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.createNewBranch: Error creating branch`,
                metadata: { error },
            });
            throw error;
        }
    }

    async createBranch({
        repositoryId,
        branchName,
        baseBranch,
    }: CreateBranchDto) {
        this.logger.log({
            message: `${this.serviceName}.createBranch: Create Branch`,
            metadata: { repositoryId, branchName, baseBranch },
        });

        try {
            const repository = await this.githubRepositoryRepository.findOne({
                where: {
                    id: repositoryId,
                },
            });

            this.logger.log({
                message: `${this.serviceName}.createBranch: Repository found`,
                metadata: { repository },
            });

            if (!repository) {
                throw new NotFoundException("Repository not found");
            }

            const branch = await this.githubBranchRepository.findOne({
                where: {
                    github_repository_id: repositoryId,
                    name: branchName,
                },
            });

            if (branch) {
                throw new BadRequestException("Branch already exists");
            }

            // Use repository's development branch if baseBranch not provided
            baseBranch = baseBranch || repository.development_branch || "dev";

            const newBranchOnGithub = await this.createNewBranchOnGithub({
                repositoryId,
                branchName,
                baseBranch,
            });

            this.logger.log({
                message: `${this.serviceName}.createBranch: Branch created on Github`,
                metadata: { newBranch: newBranchOnGithub },
            });

            const sandbox = await this.codesandboxService.createSandboxFromGit({
                repositoryId,
                branch: branchName,
            });

            this.logger.log({
                message: `${this.serviceName}.createBranch: Sandbox created`,
                metadata: { sandbox },
            });

            const createdBranch = await this.githubBranchRepository.save({
                github_repository_id: repositoryId,
                name: branchName,
                sandbox_id: sandbox.id,
                base_branch: baseBranch,
            });

            this.logger.log({
                message: `${this.serviceName}.createBranch: Branch created`,
                metadata: {
                    newBranch: newBranchOnGithub,
                    createdBranch,
                },
            });

            return createdBranch;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.createBranch: Error creating branch`,
                metadata: {
                    error,
                    repositoryId,
                    branchName,
                    baseBranch,
                },
            });
            throw error;
        }
    }

    async startTask(payload: StartGithubTaskDto) {
        const { repositoryId, message } = payload;
        let branchName = payload.branchName;

        const repository = await this.githubRepositoryRepository.findOne({
            where: {
                id: repositoryId,
            },
        });

        if (!branchName) {
            const branches = await this.getBranches(repositoryId);
            const branchNames = branches
                .map((branch) => branch.name)
                .join(", ");

            const createBranchNameMessage = `
            Here are the branches existing on the repository:
            ${branchNames}

            This is user's message:
            ${message}
            
            Please skip the branches that are already on the repository.
            Please create branch name based on the user's message to use to indicate the task that user wants to do:
            `;

            const branchNameGenerated = await this.llmService.createBranchName(
                createBranchNameMessage,
            );

            branchName = `genesoft/${branchNameGenerated}`;
            this.logger.log({
                message: `${this.serviceName}.startTask: Branch name generated`,
                metadata: {
                    branchName,
                },
            });
        }

        const newBranch = await this.createBranch({
            repositoryId,
            branchName,
            baseBranch: payload.baseBranch,
        });

        // TODO: start new conversation with user message
        const conversation = await this.conversationService.createConversation({
            project_id: repository.project_id,
            name: `Start Github Task for branch: ${branchName}`,
            status: "active",
            github_branch_id: newBranch.id,
        });

        await this.conversationService.addMessageToConversation(
            conversation.id,
            {
                sender_type: "user",
                message_type: "text",
                content: message,
                sender_id: payload.userId,
            },
        );

        const submittedConversation =
            await this.conversationService.submitConversationForGithubRepository(
                {
                    conversation_id: conversation.id,
                    github_branch_id: newBranch.id,
                },
            );

        return { ...submittedConversation, newBranch };
    }

    async getTasksByRepositoryId(repositoryId: string) {
        const repository = await this.githubRepositoryRepository.findOne({
            where: { id: repositoryId },
        });

        const projectId = repository.project_id;

        const conversations = await this.conversationRepository.find({
            where: { project_id: projectId, status: "submitted" },
        });

        if (!repository) {
            throw new NotFoundException("Repository not found");
        }

        this.logger.log({
            message: `${this.serviceName}.getIterationsByRepositoryId: Getting iterations for repository`,
            metadata: { repositoryId, projectId },
        });

        const tasks = await Promise.all(
            conversations.map(async (conversation) => {
                const iteration = await this.iterationRepository.findOne({
                    where: {
                        id: conversation.iteration_id,
                    },
                });

                return { ...conversation, iteration };
            }),
        );

        return tasks;
    }

    async createPR(payload: CreatePRDto) {
        const { repositoryId, branchId } = payload;

        const branch = await this.githubBranchRepository.findOne({
            where: { id: branchId },
        });

        const repository = await this.githubRepositoryRepository.findOne({
            where: { id: repositoryId },
        });

        this.logger.log({
            message: `${this.serviceName}.createPullRequest: Repository and branch found`,
            metadata: { repository, branch },
        });

        if (!repository) {
            throw new NotFoundException("Repository not found");
        }

        const accessToken = await this.githubService.getRepoAccessToken(
            repository.owner,
            repository.name,
        );

        const url = `${this.githubApiBaseEndpoint}/repos/${repository.owner}/${repository.name}/pulls`;
        const headers = {
            Authorization: `Bearer ${accessToken}`,
        };

        const conversation = await this.conversationRepository.findOne({
            where: { github_branch_id: branch.id },
        });

        this.logger.log({
            message: `${this.serviceName}.createPullRequest: Conversation found`,
            metadata: { conversation },
        });

        const body = {
            title: `[Genesoft] ${conversation?.name || branch.name}`,
            head: `${GenesoftGithubAgentUsername}:${branch.name}`,
            base: branch.base_branch,
        };

        this.logger.log({
            message: `${this.serviceName}.createPullRequest: Creating pull request`,
            metadata: { url, body },
        });

        const { data } = await lastValueFrom(
            this.httpService
                .post(url, body, {
                    headers,
                })
                .pipe(
                    catchError((error: AxiosError) => {
                        this.logger.error({
                            message: `${this.serviceName}.createPullRequest: Error creating pull request`,
                            metadata: { error },
                        });
                        throw error;
                    }),
                ),
        );

        this.logger.log({
            message: `${this.serviceName}.createPullRequest: Successfully created pull request`,
            metadata: {
                ...payload,
                data,
            },
        });

        return data;
    }

    async getIterationsByBranchId(branchId: string) {
        // Get the branch to find the project_id
        const branch = await this.githubBranchRepository.findOne({
            where: { id: branchId },
        });

        if (!branch) {
            throw new BadRequestException("Branch not found");
        }

        const repository = await this.githubRepositoryRepository.findOne({
            where: { id: branch.github_repository_id },
        });

        if (!repository) {
            throw new BadRequestException("Repository not found");
        }

        // Create a map of iterations by ID for faster lookups
        const iterations = await this.iterationRepository.find({
            where: { github_branch_id: branchId },
            order: { created_at: "ASC" },
        });

        const iterationMap = new Map();
        iterations.forEach((iteration) => {
            iterationMap.set(iteration.id, iteration);
        });

        // Get conversations and attach iterations in one pass
        const conversation = await this.conversationRepository.findOne({
            where: {
                project_id: repository.project_id,
                github_branch_id: branchId,
            },
            order: { created_at: "DESC" },
        });

        return {
            conversation,
            iterations,
        };
    }

    async getRepositoryTree(repositoryId: string, branch: string) {
        const repository = await this.githubRepositoryRepository.findOne({
            where: { id: repositoryId },
        });
        const accessToken = await this.githubService.getRepoAccessToken(
            repository.owner,
            repository.name,
        );

        this.logger.log({
            message: `${this.serviceName}.getRepositoryTree: Get Repository Tree`,
            metadata: { repository, branch },
        });

        const url = `${this.githubApiBaseEndpoint}/repos/${repository.owner}/${repository.name}/git/trees/${branch}?recursive=1`;
        const headers = {
            Authorization: `Bearer ${accessToken}`,
        };

        const response = await lastValueFrom(
            this.httpService
                .get(url, {
                    headers,
                })
                .pipe(
                    concatMap((res) => of(res.data)),
                    retry(2),
                    catchError((error: AxiosError) => {
                        this.logger.error({
                            message: `${this.serviceName}.getRepositoryTrees: Error get repository trees`,
                            metadata: { error: error.response.data },
                        });
                        throw error;
                    }),
                ),
        );
        return response;
    }
}
