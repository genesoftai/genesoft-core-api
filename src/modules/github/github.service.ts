import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
    LoggerService,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { GithubRepository } from "@modules/github/entity/github-repository.entity";
import {
    GetAllRepositoryEnvQuery,
    GetGithubRepositoryFromGithubDto,
    GetRepositoryTreesQuery,
} from "./dto/get-github-repository.dto";
import { CreateGithubRepositoryUsingTemplateDto } from "./dto/create-github-repository.dto";
import { catchError, concatMap, lastValueFrom, of, retry } from "rxjs";
import { AxiosError } from "axios";
import { HttpService } from "@nestjs/axios";
import {
    ProjectTemplate,
    ProjectTemplateName,
} from "@/modules/constants/project";
import { Repository } from "typeorm";
import { Project } from "../project/entity/project.entity";
import { GenericObject } from "@/modules/types/common";
import { GetRepositoryContentDto } from "./dto/get-repository-content.dto";
import {
    MergeGithubBrachDto,
    UpdateRepositoryContentDto,
} from "./dto/update-repository-content.dto";
import { GithubConfigurationService } from "../configuration/github";
import {
    CreatePullRequestDto,
    MergePullRequestDto,
} from "./dto/pull-requests.dto";
import {
    GetLatestWorkflowRunDto,
    GetWorkflowRunFailureLogsDto,
    GetWorkflowRunLogsDto,
    GetWorkflowRunsDto,
} from "./dto/workflow.dto";
import * as AdmZip from "adm-zip";
import { DeleteFileContentFromRepositoryDto } from "./dto/delete-repository-content.dto";
import { AppConfigurationService } from "../configuration/app";

@Injectable()
export class GithubService {
    private readonly serviceName: string;
    private readonly githubApiBaseEndpoint: string;
    private readonly githubAccessToken: string;
    private readonly githubOwner: string;
    @Inject() httpService: HttpService;

    constructor(
        @InjectRepository(GithubRepository)
        private readonly githubRepositoryRepository: Repository<GithubRepository>,
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,
        private readonly githubConfigurationService: GithubConfigurationService,
        private readonly appConfigurationService: AppConfigurationService,
        @Inject(Logger) private readonly logger: LoggerService,
    ) {
        this.serviceName = GithubService.name;
        this.githubApiBaseEndpoint =
            this.githubConfigurationService.githubBaseApiEndpoint;
        this.githubAccessToken =
            this.githubConfigurationService.githubAccessToken;
        this.githubOwner = this.githubConfigurationService.githubOwner;
    }

    async getGithubRepositoryFromGithub({
        repositoryName,
    }: GetGithubRepositoryFromGithubDto) {
        this.logger.log({
            message: `${this.serviceName}.getGithubRepositoryFromGithub: Get Github Repository From Github`,
            metadata: { repositoryName },
        });
        const url = `${this.githubApiBaseEndpoint}/repos/${this.githubOwner}/${repositoryName}`;
        const headers = {
            Authorization: `Bearer ${this.githubAccessToken}`,
        };

        return lastValueFrom(
            this.httpService
                .get(url, {
                    headers,
                })
                .pipe(
                    concatMap((res) => of(res.data)),
                    retry(2),
                    catchError((error: AxiosError) => {
                        this.logger.error(error?.response?.data);
                        throw error;
                    }),
                ),
        );
    }

    async linkRepositoryToProject(projectId: string, repo: any) {
        const githubRepository = await this.githubRepositoryRepository.save({
            project_id: projectId,
            type: "link",
            repo_id: repo.id.toString(),
            owner: repo.owner.login,
            name: repo.name,
            full_name: repo.full_name,
            is_active: true,
        });
        return githubRepository;
    }

    async createRepositoryFromTemplate({
        projectTemplateName,
        description,
        projectId,
    }: CreateGithubRepositoryUsingTemplateDto) {
        let templateRepo = "";
        if (projectTemplateName === ProjectTemplateName.NestJsApi) {
            templateRepo = ProjectTemplate.NestJsApi;
        } else if (projectTemplateName === ProjectTemplateName.NextJsWeb) {
            templateRepo = ProjectTemplate.NextJsWebFirebase;
        } else {
            throw new BadRequestException(
                `${this.serviceName}.createRepositoryFromTemplate: Not Support Template`,
            );
        }

        if (!projectTemplateName) {
            throw new BadRequestException(
                `${this.serviceName}.createRepositoryFromTemplate: Project Template Name required`,
            );
        }

        if (!projectId) {
            throw new BadRequestException(
                `${this.serviceName}.createRepositoryFromTemplate: Project Id required`,
            );
        }

        const name = `${projectTemplateName}_${projectId}`;

        const type =
            projectTemplateName === ProjectTemplateName.NestJsApi
                ? "api"
                : "web";

        const headers = {
            Authorization: `Bearer ${this.githubAccessToken}`,
        };

        const body = {
            owner: this.githubOwner,
            name,
            description,
            include_all_branches: true,
            private: true,
        };

        this.logger.log({
            message: `${this.serviceName}.createRepositoryFromTemplate: Create Repository from Template`,
            metadata: {
                apiEndpoint: `${this.githubApiBaseEndpoint}/repos/${this.githubOwner}/${templateRepo}/generate`,
                headers,
                body,
            },
        });

        const { data } = await lastValueFrom(
            this.httpService
                .post(
                    `${this.githubApiBaseEndpoint}/repos/${this.githubOwner}/${templateRepo}/generate`,
                    body,
                    {
                        headers,
                    },
                )
                .pipe(
                    catchError((error: AxiosError) => {
                        this.logger.error({
                            message: `${this.serviceName}.createRepositoryFromTemplate: Error create repository from template`,
                            metadata: { error },
                        });
                        throw error;
                    }),
                ),
        );

        const project = await this.projectRepository.findOne({
            where: { id: projectId },
        });

        const githubRepository = await this.githubRepositoryRepository.save({
            project_id: project.id,
            type,
            repo_id: data.id.toString(),
            owner: data.owner.login,
            name: data.name,
            full_name: data.full_name,
            is_active: true,
        });

        // Create webhook for PR events
        await this.createRepositoryWebhook(githubRepository.name);

        this.logger.log({
            message: `${this.serviceName}.createRepositoryFromTemplate: Success create repository from template`,
            metadata: {
                projectTemplateName,
                projectId,
                description,
                templateRepo,
                data,
                githubRepository,
            },
        });

        return githubRepository;
    }

    async getRepositoryContent({
        repository,
        path,
        ref,
    }: GetRepositoryContentDto) {
        this.logger.log({
            message: `${this.serviceName}.getRepositoryContent: Get Repository Content`,
            metadata: { repository, path, ref },
        });
        let url = `${this.githubApiBaseEndpoint}/repos/${this.githubOwner}/${repository}/contents/${path}`;
        if (ref) {
            url = `${url}?ref=${ref}`;
        }
        const headers = {
            Authorization: `Bearer ${this.githubAccessToken}`,
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
                            message: `${this.serviceName}.getRepositoryContent: Error get repository content`,
                            metadata: {
                                error: error.response.data,
                                path,
                                repository,
                                ref,
                            },
                        });
                        throw error;
                    }),
                ),
        );
        return {
            response,
            content: atob(response.content),
        };
    }

    async getAllEnvVars({ repository, branch }: GetAllRepositoryEnvQuery) {
        const allSrcFilesPath: string[] =
            await this.getAllSrcFilesPathInRepository({
                repository,
                branch,
            });
        const allEnvVars = [];
        for (const path of allSrcFilesPath) {
            const { content } = await this.getRepositoryContent({
                repository,
                path,
                ref: branch,
            });
            const envs = await this.getEnvVarsInContent({ content });
            for (const env of envs) {
                if (!allEnvVars.includes(env)) {
                    allEnvVars.push(env);
                }
            }
        }
        return allEnvVars;
    }

    async getEnvVarsInContent({ content }: { content: string }) {
        const allEnv = [];
        if (content.includes("process.env")) {
            // Regular expression pattern to match and capture process.env variables
            const regexPattern = /process\.env\.([A-Za-z_]+)/g;

            // Executing the regex pattern on the sample string
            let match;
            while ((match = regexPattern.exec(content)) !== null) {
                // match[1] contains the captured variable name
                allEnv.push(match[1]);
            }
        }
        return allEnv;
    }

    async getRepositoryTrees({ repository, branch }: GetRepositoryTreesQuery) {
        this.logger.log({
            message: `${this.serviceName}.getRepositoryTrees: Get Repository Trees`,
            metadata: { repository, branch },
        });
        const url = `${this.githubApiBaseEndpoint}/repos/${this.githubOwner}/${repository}/git/trees/${branch}?recursive=1`;
        const headers = {
            Authorization: `Bearer ${this.githubAccessToken}`,
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

    // Get all files in src/ to read process.env so we can know exactly all environment variables for deployment
    async getAllSrcFilesPathInRepository({
        repository,
        branch,
    }: GetAllRepositoryEnvQuery): Promise<string[]> {
        const response = await this.getRepositoryTrees({ repository, branch });
        const tree = response.tree; // tree is array of files in that repo
        const allSrcFiles: string[] = [];
        if (tree.length > 0) {
            for (const file of tree) {
                const path = file.path;
                const pathElements = path.split("/");
                if (
                    path.includes("src") &&
                    pathElements[pathElements.length - 1].includes(".")
                ) {
                    allSrcFiles.push(path);
                }
            }
        }
        return allSrcFiles;
    }

    async updateRepositoryContent(payload: UpdateRepositoryContentDto) {
        const { repository, path, message, content } = payload;
        const url = `${this.githubApiBaseEndpoint}/repos/${this.githubOwner}/${repository}/contents/${path}`;
        const headers = {
            Authorization: `Bearer ${this.githubAccessToken}`,
        };
        const body: GenericObject = {
            message,
            content: Buffer.from(content).toString("base64"),
        };

        if (payload.sha) {
            body.sha = payload.sha;
        } else {
            try {
                const existingContent = await this.getRepositoryContent({
                    path,
                    repository,
                    ref: payload.ref,
                });
                if (existingContent) {
                    body.sha = existingContent.response.sha;
                }
            } catch (error) {
                if (error?.status !== 404) {
                    this.logger.error({
                        message: `${this.serviceName}.updateRepositoryContent: Failed to get content from Github Repository`,
                        metadata: {
                            path,
                            repository,
                            ref: payload.ref,
                            error,
                        },
                    });
                }
            }
        }
        if (payload.branch) {
            body.branch = payload.branch;
        }
        if (payload.committer) {
            body.committer = payload.committer;
        }
        if (payload.author) {
            body.author = payload.author;
        }

        this.logger.log({
            message: `${this.serviceName}.updateRepositoryContent: Updating Content on Github Repository`,
            metadata: { url, body },
        });

        try {
            const { data } = await lastValueFrom(
                this.httpService
                    .put(url, body, {
                        headers,
                    })
                    .pipe(
                        catchError((error: AxiosError) => {
                            throw error;
                        }),
                    ),
            );

            this.logger.log({
                message: `${this.serviceName}.updateRepositoryContent: Success update repository content`,
                metadata: {
                    ...payload,
                    data,
                    // content: atob(data.content),
                },
            });

            return data;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.updateRepositoryContent: Error update repository content`,
                metadata: { error },
            });
            throw error;
        }
    }

    async mergeBranch(payload: MergeGithubBrachDto) {
        const { repo, base, head, commitMessage } = payload;
        const url = `${this.githubApiBaseEndpoint}/repos/${this.githubOwner}/${repo}/merges`;
        const headers = {
            Authorization: `Bearer ${this.githubAccessToken}`,
        };

        const { data } = await lastValueFrom(
            this.httpService
                .post(
                    url,
                    { base, head, commitMessage },
                    {
                        headers,
                    },
                )
                .pipe(
                    catchError((error: AxiosError) => {
                        this.logger.error({
                            message: `${this.serviceName}.mergeBranch: Error merge branch`,
                            metadata: { error },
                        });
                        throw error;
                    }),
                ),
        );

        this.logger.log({
            message: `${this.serviceName}.mergeBranch: Success merge branch`,
            metadata: {
                ...payload,
                data,
            },
        });

        return data;
    }

    async createPullRequest(payload: CreatePullRequestDto) {
        const { repository, title, head, base } = payload;

        const url = `${this.githubApiBaseEndpoint}/repos/${this.githubOwner}/${repository}/pulls`;
        const headers = {
            Authorization: `Bearer ${this.githubAccessToken}`,
            // Accept: "application/vnd.github+json",
        };

        const body = {
            title,
            head,
            base,
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

    async mergePullRequest(payload: MergePullRequestDto) {
        const {
            repository,
            pull_number,
            commit_title,
            commit_message,
            merge_method,
        } = payload;

        const url = `${this.githubApiBaseEndpoint}/repos/${this.githubOwner}/${repository}/pulls/${pull_number}/merge`;
        const headers = {
            Authorization: `Bearer ${this.githubAccessToken}`,
            // Accept: "application/vnd.github+json",
        };

        const body = {
            commit_title,
            commit_message,
            merge_method,
        };

        this.logger.log({
            message: `${this.serviceName}.mergePullRequest: Merging pull request`,
            metadata: { url, body },
        });

        const { data } = await lastValueFrom(
            this.httpService
                .put(url, body, {
                    headers,
                })
                .pipe(
                    catchError((error: AxiosError) => {
                        this.logger.error({
                            message: `${this.serviceName}.mergePullRequest: Error merging pull request`,
                            metadata: { error },
                        });
                        throw error;
                    }),
                ),
        );

        this.logger.log({
            message: `${this.serviceName}.mergePullRequest: Successfully merged pull request`,
            metadata: {
                ...payload,
                data,
            },
        });

        return data;
    }

    async getPullRequest(payload: { repository: string; pull_number: number }) {
        const { repository, pull_number } = payload;
        const url = `${this.githubApiBaseEndpoint}/repos/${this.githubOwner}/${repository}/pulls/${pull_number}`;
        const headers = {
            Authorization: `Bearer ${this.githubAccessToken}`,
            Accept: "application/vnd.github.v3+json",
        };

        this.logger.log({
            message: `${this.serviceName}.getPullRequest: Getting pull request details`,
            metadata: { url },
        });

        try {
            const { data } = await lastValueFrom(
                this.httpService
                    .get(url, {
                        headers,
                    })
                    .pipe(
                        catchError((error: AxiosError) => {
                            this.logger.error({
                                message: `${this.serviceName}.getPullRequest: Error getting pull request details`,
                                metadata: { error },
                            });
                            throw error;
                        }),
                    ),
            );

            console.log(data);
            return data;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.getPullRequest: Failed to get pull request details`,
                metadata: { error },
            });
            throw error;
        }
    }

    async getWorkflowRuns(payload: GetWorkflowRunsDto) {
        const { repository, branch } = payload;
        const url = `${this.githubApiBaseEndpoint}/repos/${this.githubOwner}/${repository}/actions/runs?branch=${branch}`;
        const headers = {
            Authorization: `Bearer ${this.githubAccessToken}`,
        };

        this.logger.log({
            message: `${this.serviceName}.getWorkflows: Getting workflows`,
            metadata: { url, headers },
        });

        const response = await lastValueFrom(
            this.httpService.get(url, { headers }).pipe(
                concatMap((res) => of(res.data)),
                retry(2),
                catchError((error: AxiosError) => {
                    this.logger.error({
                        message: `${this.serviceName}.getWorkflows: Error getting workflows`,
                        metadata: { error },
                    });
                    throw error;
                }),
            ),
        );

        this.logger.log({
            message: `${this.serviceName}.getWorkflows: Successfully got workflows`,
            metadata: {
                response,
            },
        });

        return response;
    }

    async getLatestWorkflowRun(payload: GetLatestWorkflowRunDto) {
        const { project_id, branch } = payload;
        const repository = await this.githubRepositoryRepository.findOne({
            where: {
                project_id,
                type: "api",
            },
        });
        const response = await this.getWorkflowRuns({
            repository: repository.name,
            branch,
        });
        const latestWorkflowRun = response.workflow_runs[0];

        if (latestWorkflowRun.conclusion !== "failure") {
            return {
                latestWorkflowRun,
                logs: "",
                status: "success",
            };
        }

        const headers = {
            Authorization: `Bearer ${this.githubAccessToken}`,
        };

        const jobsResponse = await lastValueFrom(
            this.httpService.get(latestWorkflowRun.jobs_url, { headers }).pipe(
                concatMap((res) => of(res.data)),
                retry(2),
                catchError((error: AxiosError) => {
                    this.logger.error({
                        message: `${this.serviceName}.getWorkflowRunFailureLogs: Error getting workflow run logs`,
                        metadata: { error },
                    });
                    throw error;
                }),
            ),
        );
        const job = jobsResponse.jobs[0];

        const failedStep = job?.steps?.find(
            (step) => step.conclusion === "failure",
        );

        if (!failedStep) {
            return {
                latestWorkflowRun,
                logs: "",
                status: "failed",
            };
        }

        const logs = await this.getWorkflowRunFailureLogs({
            repository: repository.name,
            run_id: latestWorkflowRun.id,
            failed_step: failedStep.number,
        });

        return {
            latestWorkflowRun,
            logs,
            status: "failed",
        };
    }

    async getWorkflowRunLogs(payload: GetWorkflowRunLogsDto) {
        const { repository, run_id } = payload;
        const url = `${this.githubApiBaseEndpoint}/repos/${this.githubOwner}/${repository}/actions/runs/${run_id}/logs`;
        const headers = {
            Authorization: `Bearer ${this.githubAccessToken}`,
            Accept: "application/vnd.github.v3+json",
            "Accept-Encoding": "gzip, deflate, br",
        };

        const response = await lastValueFrom(
            this.httpService
                .get(url, {
                    headers,
                    responseType: "arraybuffer",
                })
                .pipe(
                    concatMap((res) => of(res.data)),
                    retry(2),
                    catchError((error: AxiosError) => {
                        this.logger.error({
                            message: `${this.serviceName}.getWorkflowRunLogs: Error getting workflow run logs`,
                            metadata: { error },
                        });
                        throw error;
                    }),
                ),
        );

        const logs = this.extractZipData(response);
        const filteredBuildLogsKey = Object.keys(logs).filter((key) =>
            key.includes("build/"),
        );
        this.logger.log({
            message: `${this.serviceName}.getWorkflowRunLogs: Filtered build logs key`,
            metadata: {
                filteredBuildLogsKey,
            },
        });
        const sortedBuildLogsKey = filteredBuildLogsKey.sort((keyA, keyB) => {
            const numA = parseInt(keyA.split("/")[1].split("_")[0] || "0");
            const numB = parseInt(keyB.split("/")[1].split("_")[0] || "0");
            return numA - numB;
        });

        this.logger.log({
            message: `${this.serviceName}.getWorkflowRunLogs: Sorted build logs key`,
            metadata: {
                sortedBuildLogsKey,
            },
        });
        // const filteredLogs = logs.filter((log) => log.includes("##[section]"));
        let formattedLogs = "";

        // Combine all log files into a single string with file headers
        sortedBuildLogsKey.forEach((filename) => {
            formattedLogs += `
        Log file name:${filename}
        Logs:
        ${logs[filename]}\

        `;
        });

        return formattedLogs.trim();
    }

    async getWorkflowRunFailureLogs(payload: GetWorkflowRunFailureLogsDto) {
        const { repository, run_id, failed_step } = payload;
        const url = `${this.githubApiBaseEndpoint}/repos/${this.githubOwner}/${repository}/actions/runs/${run_id}/logs`;
        const headers = {
            Authorization: `Bearer ${this.githubAccessToken}`,
            Accept: "application/vnd.github.v3+json",
            "Accept-Encoding": "gzip, deflate, br",
        };

        const response = await lastValueFrom(
            this.httpService
                .get(url, {
                    headers,
                    responseType: "arraybuffer",
                })
                .pipe(
                    concatMap((res) => of(res.data)),
                    retry(2),
                    catchError((error: AxiosError) => {
                        this.logger.error({
                            message: `${this.serviceName}.getWorkflowRunLogs: Error getting workflow run logs`,
                            metadata: { error },
                        });
                        throw error;
                    }),
                ),
        );

        const logs = this.extractZipData(response);
        const fileNames = Object.keys(logs);
        const failedStepFileName = fileNames.find((fileName) =>
            fileName.includes(`build/${failed_step}`),
        );
        const failedStepLogs = logs[failedStepFileName];

        this.logger.log({
            message: `${this.serviceName}.getWorkflowRunFailureLogs: Failed step logs`,
            metadata: {
                failedStepLogs,
            },
        });

        const formattedLog = `
        Log file name for failed step:${failedStepFileName}
        Logs for failed step:
        ${failedStepLogs}`;

        return formattedLog.trim();
    }

    extractZipData(buffer: Buffer): Record<string, string> {
        const zip = new AdmZip(buffer);
        const zipEntries = zip.getEntries();
        const extractedFiles: Record<string, string> = {};

        zipEntries.forEach((entry) => {
            if (!entry.isDirectory) {
                const fileName = entry.entryName;
                const fileContent = entry.getData().toString("utf8");
                extractedFiles[fileName] = fileContent;
            }
        });

        return extractedFiles;
    }

    async deleteFileContentFromRepository(
        payload: DeleteFileContentFromRepositoryDto,
    ) {
        const { repository, path, message, branch, committer } = payload;
        const url = `${this.githubApiBaseEndpoint}/repos/${this.githubOwner}/${repository}/contents/${path}`;
        const headers = {
            Authorization: `Bearer ${this.githubAccessToken}`,
        };
        try {
            const githubContent = await this.getRepositoryContent({
                repository,
                path,
                ref: branch,
            });
            this.logger.log({
                message: `${this.serviceName}.deleteFileContentFromRepository: Github content`,
                metadata: { githubContent },
            });
            const data = {
                message,
                branch,
                committer,
                sha: githubContent.response.sha,
            };
            this.logger.log({
                message: `${this.serviceName}.deleteFileContentFromRepository: Data`,
                metadata: { data },
            });
            const response = await lastValueFrom(
                this.httpService.delete(url, { headers, data }).pipe(
                    concatMap((res) => of(res.data)),
                    retry(2),
                    catchError((error: AxiosError) => {
                        this.logger.error({
                            message: `${this.serviceName}.deleteFileContentFromRepository: Error deleting file content from repository`,
                            metadata: { error },
                        });
                        throw error;
                    }),
                ),
            );
            this.logger.log({
                message: `${this.serviceName}.deleteFileContentFromRepository: Response`,
                metadata: { response },
            });
            return response;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.deleteFileContentFromRepository: Error deleting file content from repository`,
                metadata: { error },
            });
            throw error;
        }
    }

    async addUserToCollaborator(repoName: string, username: string) {
        const url = `https://api.github.com/repos/${this.githubOwner}/${repoName}/collaborators/${username}`;
        return lastValueFrom(
            this.httpService.put(
                url,
                {
                    permission: "triage",
                },
                {
                    headers: {
                        Accept: "application/vnd.github+json",
                        Authorization: `Bearer ${this.githubAccessToken}`,
                        "X-GitHub-Api-Version": "2022-11-28",
                    },
                },
            ),
        );
    }

    /**
     * Creates a webhook for a repository to listen for PR events
     * @param repositoryName The name of the repository
     */
    async createRepositoryWebhook(repositoryName: string) {
        this.logger.log({
            message: `${this.serviceName}.createRepositoryWebhook: Creating webhook for repository`,
            metadata: { repositoryName },
        });

        const url = `${this.githubApiBaseEndpoint}/repos/${this.githubOwner}/${repositoryName}/hooks`;
        const headers = {
            Authorization: `Bearer ${this.githubAccessToken}`,
            Accept: "application/vnd.github.v3+json",
        };

        const webhookUrl = this.appConfigurationService.githubWebhookUrl;
        const webhookSecret = this.appConfigurationService.githubWebhookSecret;

        if (!webhookUrl || !webhookSecret) {
            this.logger.error({
                message: `${this.serviceName}.createRepositoryWebhook: Webhook URL or secret not configured`,
            });
            return;
        }

        const body = {
            name: "web",
            active: true,
            events: ["pull_request"],
            config: {
                url: webhookUrl,
                content_type: "json",
                secret: webhookSecret,
                insecure_ssl: "0",
            },
        };

        try {
            const { data } = await lastValueFrom(
                this.httpService
                    .post(url, body, {
                        headers,
                    })
                    .pipe(
                        catchError((error: AxiosError) => {
                            this.logger.error({
                                message: `${this.serviceName}.createRepositoryWebhook: Error creating webhook`,
                                metadata: { error: error.response?.data },
                            });
                            throw error;
                        }),
                    ),
            );

            this.logger.log({
                message: `${this.serviceName}.createRepositoryWebhook: Successfully created webhook`,
                metadata: { data },
            });

            return data;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.createRepositoryWebhook: Failed to create webhook`,
                metadata: { error },
            });
            // Don't throw the error to prevent blocking repository creation
        }
    }

    async getRepoAccessTokenUrl(owner: string, repo: string) {
        // Call external API to get repository URL with access token
        try {
            const apiUrl =
                "https://prime-zulema-genesoft-a6d86b7d.koyeb.app/api/repo-url";
            const { data } = await lastValueFrom(
                this.httpService
                    .get(`${apiUrl}?owner=${owner}&repo=${repo}`)
                    .pipe(
                        catchError((error: AxiosError) => {
                            this.logger.error({
                                message: `${this.serviceName}.getRepoAccessTokenUrl: Error getting repo URL with token`,
                                metadata: { error: error.response?.data },
                            });
                            throw error;
                        }),
                    ),
            );
            if (data && data.repoUrl) {
                this.logger.log({
                    message: `${this.serviceName}.getRepoAccessTokenUrl: Successfully retrieved repo URL with token`,
                });
                return data.repoUrl;
            }
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.getRepoAccessTokenUrl: Failed to get repo URL with token`,
                metadata: { error },
            });
            // Fall back to the default URL if the API call fails
        }
    }
}
