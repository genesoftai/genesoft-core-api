import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Codebase } from "./entity/codebase.entity";
import { Repository } from "typeorm";
import { InitialCodebaseUnderstandingForNextjsProject } from "../constants/frontend_codebase";
import { InitialCodebaseUnderstandingForNestjsProject } from "../constants/backend_codebase";
import { GithubService } from "../github/github.service";
import { Project } from "../project/entity/project.entity";
import { GithubRepository } from "../github/entity/github-repository.entity";
import { CodesandboxService } from "../codesandbox/codesandbox.service";
import { UpdateFileDto } from "./dto/update-file.dto";

@Injectable()
export class CodebaseService {
    serviceName = CodebaseService.name;
    private readonly logger = new Logger(this.serviceName);

    constructor(
        @InjectRepository(Codebase)
        private readonly codebaseRepository: Repository<Codebase>,
        private readonly githubService: GithubService,
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,
        @InjectRepository(GithubRepository)
        private readonly githubRepositoryRepository: Repository<GithubRepository>,
        private readonly codesandboxService: CodesandboxService,
    ) {}

    async createCodebase(projectId: string) {
        try {
            const codebase = this.codebaseRepository.create({
                project_id: projectId,
            });
            return this.codebaseRepository.save(codebase);
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.createCodebase: Error creating codebase`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            throw error;
        }
    }

    async getCodebase(projectId: string) {
        try {
            return this.codebaseRepository.findOne({
                where: { project_id: projectId },
            });
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.getCodebase: Error getting codebase`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            throw error;
        }
    }

    async updateCodebase(projectId: string, understanding: string) {
        try {
            const codebase = await this.getCodebase(projectId);
            codebase.understanding = understanding;
            return this.codebaseRepository.save(codebase);
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.updateCodebase: Error updating codebase`,
            });
            throw error;
        }
    }

    async deleteCodebase(projectId: string) {
        try {
            return this.codebaseRepository.delete(projectId);
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.deleteCodebase: Error deleting codebase`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            throw error;
        }
    }

    async createCodebaseForNextjsProject(projectId: string) {
        try {
            const codebase = this.codebaseRepository.create({
                project_id: projectId,
            });
            codebase.understanding =
                InitialCodebaseUnderstandingForNextjsProject;
            return this.codebaseRepository.save(codebase);
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.createCodebaseForNextjsProject: Error creating codebase for nextjs project`,
            });
            throw error;
        }
    }

    async createCodebaseForNestjsProject(projectId: string) {
        try {
            const codebase = this.codebaseRepository.create({
                project_id: projectId,
            });
            codebase.understanding =
                InitialCodebaseUnderstandingForNestjsProject;
            return this.codebaseRepository.save(codebase);
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.createCodebaseForNextjsProject: Error creating codebase for nextjs project`,
            });
            throw error;
        }
    }

    async createCodebaseForGitProject(projectId: string) {
        try {
            const codebase = this.codebaseRepository.create({
                project_id: projectId,
            });
            // For Git projects, we'll start with an empty understanding since the codebase will be populated from the Git repository
            codebase.understanding = "This is a Git-based project. The codebase will be populated from the connected Git repository.";
            return this.codebaseRepository.save(codebase);
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.createCodebaseForGitProject: Error creating codebase for git project`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            throw error;
        }
    }

    async getRepositoryTreesFromProject(projectId: string) {
        try {
            const githubRepository =
                await this.githubRepositoryRepository.findOne({
                    where: { project_id: projectId },
                });
            const project = await this.projectRepository.findOne({
                where: { id: projectId },
            });
            if (!project.sandbox_id) {
                throw new Error("Sandbox not found");
            }
            const repositoryTrees = await this.githubService.getRepositoryTrees(
                {
                    repository: githubRepository.name,
                    branch: "dev",
                },
            );
            return repositoryTrees;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.getFilesFromProject: Error getting files from project`,
            });
            throw error;
        }
    }

    async getFileTreeFromProject(projectId: string) {
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
        });
        if (!project.sandbox_id) {
            throw new Error("Sandbox not found");
        }
        const fileTree = await this.codesandboxService.getFileTreeFromSandbox(project.sandbox_id);
        return fileTree;
    }

    async getFileContentFromProject(projectId: string, path: string) {
        this.logger.log({
            message: `${this.serviceName}.getFileContentFromProject: Getting file content from project`,
            metadata: {
                projectId,
                path,
            },
        });
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
        });
        if (!project.sandbox_id) {
            throw new Error("Sandbox not found");
        }
        const githubRepository = await this.githubRepositoryRepository.findOne({
            where: { project_id: projectId },
        });
        if (!githubRepository.name) {
            throw new Error("Github repository not found");
        }
        try {
            const fileContent = await this.githubService.getRepositoryContent({
                repository: githubRepository.name,
                path,
                ref: "dev",
            });
            return {
                content: fileContent.content,
                path,
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.getFileContentFromProject: Error getting file content from project`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            throw error;
        }
    }

    async updateRepositoryFile(payload: UpdateFileDto) {
        const { projectId, path, content, message } = payload;
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
        });
        try {
            let updatedFileOnSandbox;
            if (project.sandbox_id) {
                updatedFileOnSandbox =
                    await this.codesandboxService.writeFileOnSandbox({
                        sandbox_id: project.sandbox_id,
                        path,
                        content,
                    });
            }

            return {
                status: "success",
                message: "File updated",
                updatedFileOnSandbox,
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.updateRepositoryTreesFromProject: Error updating repository trees from project`,
            });
            throw error;
        }
    }

    // TODO: delete files from the project
    async deleteRepositoryTreesFromProject(projectId: string, path: string) {
        const committer = {
            name: "khemmapichpanyana",
            email: "khemmapich@gmail.com",
        };
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
        });
        if (!project.sandbox_id) {
            throw new Error("Sandbox not found");
        }
        const githubRepository = await this.githubRepositoryRepository.findOne({
            where: { project_id: projectId },
        });
        if (!githubRepository.name) {
            throw new Error("Github repository not found");
        }
        try {
            let deletedFileOnSandbox;
            if (project.sandbox_id) {
                deletedFileOnSandbox =
                    await this.codesandboxService.deleteFileOnSandbox({
                        sandbox_id: project.sandbox_id,
                        path,
                    });
            }
            let deletedFileOnGithub;
            if (githubRepository.name) {
                deletedFileOnGithub =
                    await this.githubService.deleteFileContentFromRepository({
                        repository: githubRepository.name,
                        branch: "dev",
                        path,
                        message: "File deleted",
                        committer,
                    });
            }
            return {
                status: "success",
                message: "File deleted",
                deletedFileOnSandbox,
                deletedFileOnGithub,
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.deleteRepositoryTreesFromProject: Error deleting repository trees from project`,
            });
            throw error;
        }
    }
}
