import { Injectable, Logger } from "@nestjs/common";
import { CodeSandbox, VMTier, WebSocketSession } from "@codesandbox/sdk";
import { ThirdPartyConfigurationService } from "../configuration/third-party/third-party.service";
import {
    CreateSandboxDto,
    CreateSandboxFromGitDto,
} from "./dto/create-sandbox.dto";
import { CodesandboxTemplateId } from "../constants/codesandbox";
import {
    CopyFileOnSandboxDto,
    DeleteFileOnSandboxDto,
    DownloadFileOnSandboxDto,
    ListFilesOnSandboxDto,
    ReadFileOnSandboxDto,
    RenameFileOnSandboxDto,
    UploadFileOnSandboxDto,
    WriteFileOnSandboxDto,
} from "./dto/file-systems.dto";
import { RunCommandOnSandboxDto } from "./dto/run-sandbox.dto";
import { HttpService } from "@nestjs/axios";
import { GithubService } from "../github/github.service";
import { InjectRepository } from "@nestjs/typeorm";
import { GithubRepository } from "../github/entity/github-repository.entity";
import { Repository } from "typeorm";
import { GenesoftGithubAgentUsername } from "../constants/github";
import { GenesoftGithubAgentUserEmail } from "../constants/github";
import { formatGithubRepositoryTreeFromSandbox } from "@/utils/sandbox/tree";

@Injectable()
export class CodesandboxService {
    sandboxClients: Map<string, WebSocketSession> = new Map();
    sdk: CodeSandbox;
    private readonly logger = new Logger(CodesandboxService.name);
    private readonly serviceName = CodesandboxService.name;

    constructor(
        private readonly thirdPartyConfigurationService: ThirdPartyConfigurationService,
        private readonly httpService: HttpService,
        private readonly githubService: GithubService,
        @InjectRepository(GithubRepository)
        private readonly githubRepositoryRepository: Repository<GithubRepository>,
    ) {
        this.sdk = new CodeSandbox(
            this.thirdPartyConfigurationService.codesandboxApiKey,
        );
    }

    async createConnection(sandboxId: string) {
        this.logger.log({
            message: `${this.serviceName}: Creating connection to sandbox`,
            metadata: {
                sandboxId,
            },
        });
        const sandbox = await this.sdk.sandboxes.resume(sandboxId);
        const session = await sandbox.connect({
            id: sandboxId,
            permission: "write",
        });
        this.logger.log({
            message: `${this.serviceName}: Connection to sandbox created`,
            metadata: {
                sandboxId,
            },
        });
        this.sandboxClients.set(sandboxId, session);
        return session;
    }

    async closeConnection(sandboxId: string) {
        const sandbox = this.sandboxClients.get(sandboxId);
        if (sandbox) {
            await sandbox.disconnect();
            this.sandboxClients.delete(sandboxId);
        }
        this.logger.log({
            message: `${this.serviceName}: Closed connection to sandbox`,
            metadata: {
                sandboxId,
            },
        });
        return {
            status: "closed",
            sandboxId,
            message: "Connection closed",
        };
    }

    async getConnection(sandboxId: string) {
        if (this.sandboxClients.has(sandboxId)) {
            this.logger.log({
                message: `${this.serviceName}: Connection to sandbox already exists`,
                metadata: {
                    sandboxId,
                },
            });
            const sandbox = this.sandboxClients.get(sandboxId);
            if (sandbox.state === "DISCONNECTED") {
                await sandbox.reconnect();
                return sandbox;
            }
            return sandbox;
        }
        this.logger.log({
            message: `${this.serviceName}: Creating connection to sandbox`,
            metadata: {
                sandboxId,
            },
        });
        return this.createConnection(sandboxId);
    }

    async getSandboxSession(
        sandboxId: string,
        permission: "read" | "write" = "write",
        repositoryId?: string,
    ) {
        const sandbox = await this.sdk.sandboxes.resume(sandboxId);
        if (repositoryId) {
            const githubRepository =
                await this.githubRepositoryRepository.findOne({
                    where: {
                        id: repositoryId,
                    },
                });
            const accessToken = await this.githubService.getRepoAccessToken(
                githubRepository.owner,
                githubRepository.name,
            );
            const session = await sandbox.connect({
                id: sandboxId,
                permission,
                git: {
                    accessToken,
                    email: GenesoftGithubAgentUserEmail,
                    name: GenesoftGithubAgentUsername,
                },
            });
            return session;
        } else {
            const session = await sandbox.connect({
                id: sandboxId,
                permission: "write",
            });
            return session;
        }
    }

    async cloneRepository(payload: {
        sandbox_id: string;
        repository_url: string;
        branch: string;
    }) {
        const { sandbox_id, repository_url, branch } = payload;
        await this.runCommandOnSandbox({
            sandbox_id,
            command: `git clone -b ${branch} ${repository_url} app`,
        });
    }

    async createSandbox(payload: CreateSandboxDto) {
        const sandbox = await this.sdk.sandboxes.create({
            source: "template",
            id: payload.template ?? CodesandboxTemplateId.NewNextJsShadcn,
            title: payload.title ?? "Next.js Shadcn",
            description: payload.description ?? "A sandbox for Next.js Shadcn",
            vmTier: VMTier.Micro,
            hibernationTimeoutSeconds: 60 * 5,
            privacy: "public",
        });

        const id = sandbox.id;
        this.logger.log({
            message: `${this.serviceName}: Sandbox created`,
            metadata: {
                id: sandbox.id,
            },
        });

        return {
            id,
            status: "created",
        };
    }

    async createSandboxFromGit(payload: CreateSandboxFromGitDto) {
        const githubRepository = await this.githubRepositoryRepository.findOne({
            where: {
                id: payload.repositoryId,
            },
        });
        const accessToken = await this.githubService.getRepoAccessToken(
            githubRepository.owner,
            githubRepository.name,
        );
        const repositoryUrl = `https://github.com/${githubRepository.owner}/${githubRepository.name}.git`;

        this.logger.log({
            message: `${this.serviceName}: Creating sandbox from git`,
            metadata: {
                githubRepository,
                repositoryUrl,
                branch: payload.branch,
                accessToken,
                GenesoftGithubAgentUserName: GenesoftGithubAgentUsername,
                GenesoftGithubAgentUserEmail,
            },
        });

        // const sandbox = await this.sdk.sandboxes.create({
        //     title: `${githubRepository.owner}/${githubRepository.name}_${payload.branch}`,
        //     description: `Sandbox for Genesoft AI Agents to working on Github repository: ${githubRepository.name}`,
        //     source: "git",
        //     url: repositoryUrl,
        //     branch: payload.branch,
        //     vmTier: VMTier.Micro,
        //     hibernationTimeoutSeconds: 60 * 5,
        //     privacy: "public",
        //     config: {
        //         accessToken,
        //         email: GenesoftGithubAgentUserEmail,
        //         name: GenesoftGithubAgentUserName,
        //     },
        //     async setup(session) {
        //         console.log("Sandbox Created", {
        //             id: session.id,
        //         });
        //         await session.fs.remove("README.md");
        //         console.log("Removed README.md");
        //         await session.commands.run("git checkout " + payload.branch);
        //         console.log("Checked out branch", payload.branch);
        //     },
        // });

        const sandbox = await this.sdk.sandboxes.create({
            title: `${githubRepository.owner}/${githubRepository.name}_${payload.branch}`,
            description: `Sandbox for Genesoft AI Agents to working on Github repository: ${githubRepository.name}`,
            source: "template",
            vmTier: VMTier.Micro,
            hibernationTimeoutSeconds: 60 * 5,
            privacy: "public",
        });

        const sandboxId = sandbox.id;
        this.logger.log({
            message: `${this.serviceName}: Sandbox created`,
            metadata: {
                sandboxId,
            },
        });

        const session = await sandbox.connect({
            id: sandboxId,
            permission: "write",
            git: {
                accessToken,
                email: GenesoftGithubAgentUserEmail,
                name: GenesoftGithubAgentUsername,
            },
        });

        await session.fs.remove("README.md");
        console.log("Removed README.md");
        await session.commands.run(
            `git remote set-url origin ${repositoryUrl}`,
        );
        console.log("Set remote url", repositoryUrl);
        await session.commands.run("git fetch --all");
        console.log("Fetched all");
        await session.commands.run(`git checkout ${payload.branch}`);
        console.log("Checked out branch", payload.branch);

        await session.disconnect();

        return {
            id: sandboxId,
            status: "created",
            source: "git",
            url: repositoryUrl,
            branch: payload.branch,
        };
    }

    async getSandbox(id: string) {
        const sandbox = this.sandboxClients.get(id);

        try {
            return sandbox;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}ใ: Error getting sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            throw error;
        }
    }

    async stopSandbox(id: string) {
        const sandbox = await this.getConnection(id);
        try {
            await sandbox.disconnect();
            return {
                id,
                status: "stopped",
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}: Error stopping sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            throw error;
        }
    }

    async restartSandbox(id: string) {
        try {
            await this.stopSandbox(id);
            this.logger.log({
                message: `${this.serviceName}: Sandbox stopped`,
                metadata: {
                    id,
                },
            });
            await this.createConnection(id);
            this.logger.log({
                message: `${this.serviceName}: Sandbox started`,
                metadata: {
                    id,
                },
            });
            return {
                id,
                status: "restarted",
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}: Error restarting sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            throw error;
        }
    }

    async getFileTreeFromSandbox(id: string, path: string = "/") {
        const ignoreDir = ["node_modules", ".git"];
        const workspacePath = `/project/workspace${path}`;
        const sandbox = await this.getConnection(id);
        this.logger.log({
            message: `${this.serviceName}.getFileTreeFromSandbox: Sandbox connected`,
            metadata: {
                // sandbox,
            },
        });

        const entries = await sandbox.fs.readdir(workspacePath);
        this.logger.log({
            message: `${this.serviceName}.getFileTreeFromSandbox: Entries read`,
            metadata: {
                id,
                path,
                entries,
            },
        });

        // return entries;
        const files = [];
        for (const entry of entries) {
            this.logger.log({
                message: `${this.serviceName}.getFileTreeFromSandbox: Entry found`,
                metadata: {
                    entry,
                },
            });
            const fullPath =
                path === "/" ? `/${entry.name}` : `${path}/${entry.name}`;

            if (entry.type === "directory" && !ignoreDir.includes(entry.name)) {
                // Add the directory to the files list
                files.push({
                    path: fullPath,
                    type: "tree",
                    name: entry.name,
                });

                // Get files from subdirectory
                const subFiles = await this.getFileTreeFromSandbox(
                    id,
                    fullPath,
                );
                files.push(...subFiles.files);
            } else if (!ignoreDir.includes(entry.name)) {
                files.push({
                    path: fullPath,
                    type: "blob",
                    name: entry.name,
                });
            }
        }
        const formatted = formatGithubRepositoryTreeFromSandbox(files);
        return { files, formatted };
    }

    /**
     * Write text content to a file in the sandbox
     */
    async writeFileOnSandbox(payload: WriteFileOnSandboxDto) {
        const { sandbox_id, path, content } = payload;
        const sandbox = await this.getConnection(sandbox_id);
        try {
            // Use sandbox.fs directly instead of creating a session
            await sandbox.fs.writeTextFile(path, content);

            this.logger.log({
                message: `${this.serviceName}.writeFileOnSandbox: File written on sandbox`,
                metadata: {
                    sandbox_id,
                    path,
                },
            });
            return {
                sandbox_id,
                path,
                status: "file_written",
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.writeFileOnSandbox: Error writing file on sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            throw error;
        }
    }

    /**
     * Read text content from a file in the sandbox
     */
    async readFileOnSandbox(payload: ReadFileOnSandboxDto) {
        const { sandbox_id, path } = payload;
        this.logger.log({
            message: `${this.serviceName}.readFileOnSandbox: Reading file on sandbox`,
            metadata: {
                sandbox_id,
                path,
            },
        });
        const sandbox = await this.getConnection(sandbox_id);

        try {
            const content = await sandbox.fs.readTextFile(path);
            return {
                sandbox_id,
                path,
                status: "file_read",
                content,
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.readFileOnSandbox: Error reading file on sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            throw error;
        }
    }

    /**
     * Delete a file or directory in the sandbox
     */
    async deleteFileOnSandbox(payload: DeleteFileOnSandboxDto) {
        const { sandbox_id, path } = payload;
        const sandbox = await this.getConnection(sandbox_id);
        try {
            await sandbox.fs.remove(path);
            return {
                sandbox_id,
                path,
                status: "file_deleted",
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}: Error deleting file on sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            throw error;
        }
    }

    /**
     * List files and directories in a sandbox directory
     */
    async listFilesOnSandbox(payload: ListFilesOnSandboxDto) {
        const { sandbox_id, path } = payload;
        const sandbox = await this.getConnection(sandbox_id);
        try {
            const files = await sandbox.fs.readdir(path);
            return files;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.listFilesOnSandbox: Error listing files on sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
        }
    }

    /**
     * Upload a binary file to the sandbox
     */
    async uploadFileOnSandbox(payload: UploadFileOnSandboxDto) {
        const { sandbox_id, path, content } = payload;
        const sandbox = await this.getConnection(sandbox_id);
        try {
            await sandbox.fs.writeFile(path, content);
            return {
                sandbox_id,
                path,
                status: "file_uploaded",
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.uploadFileOnSandbox: Error uploading file on sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            throw error;
        }
    }

    /**
     * Get a download URL for a file or directory from the sandbox
     * The URL will be valid for 5 minutes
     */
    async downloadFileFromSandbox(payload: DownloadFileOnSandboxDto) {
        const { sandbox_id, path } = payload;
        const sandbox = await this.getConnection(sandbox_id);
        try {
            const { downloadUrl } = await sandbox.fs.download(path);
            return {
                sandbox_id,
                path,
                downloadUrl,
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.downloadFileFromSandbox: Error downloading file from sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            throw error;
        }
    }

    /**
     * Rename or move a file within the sandbox
     */
    async renameFileOnSandbox(payload: RenameFileOnSandboxDto) {
        const { sandbox_id, old_path, new_path } = payload;
        const sandbox = await this.getConnection(sandbox_id);
        try {
            await sandbox.fs.rename(old_path, new_path);
            return {
                sandbox_id,
                old_path,
                new_path,
                status: "file_renamed",
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.renameFileOnSandbox: Error renaming file on sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            throw error;
        }
    }

    /**
     * Copy a file within the sandbox
     */
    async copyFileOnSandbox(payload: CopyFileOnSandboxDto) {
        const { sandbox_id, original_path, copied_file_path } = payload;
        const sandbox = await this.getConnection(sandbox_id);
        try {
            await sandbox.fs.copy(original_path, copied_file_path);
            return {
                sandbox_id,
                original_path,
                copied_file_path,
                status: "file_copied",
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.copyFileOnSandbox: Error copying file on sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            throw error;
        }
    }

    async getPortInfoOnSandbox(sandbox_id: string, port: number) {
        const sandbox = await this.getConnection(sandbox_id);

        try {
            // Get all opened ports
            const portInfo = sandbox.ports.get(port);

            return {
                sandbox_id,
                port,
                portInfo,
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.getPortInfoOnSandbox: Error getting port info on sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            throw error;
        }
    }

    async runCommandOnSandbox(payload: RunCommandOnSandboxDto) {
        this.logger.log({
            message: `${this.serviceName}.runCommandOnSandbox: Running command on sandbox`,
            metadata: {
                payload,
            },
        });
        const { sandbox_id, command } = payload;
        const sandbox = await this.getConnection(sandbox_id);
        try {
            // Run the command with a timeout of 180 seconds

            const commandPromise = sandbox.commands.run(command);
            const timeoutPromise: Promise<{
                sandbox_id: string;
                command: string;
                output: string;
                exitCode: number;
            }> = new Promise((resolve) => {
                setTimeout(
                    () =>
                        resolve({
                            sandbox_id,
                            command,
                            output: "Command execution timed out after 180 seconds",
                            exitCode: 1,
                        }),
                    180000,
                );
            });

            const output = await Promise.race([commandPromise, timeoutPromise]);
            return {
                sandbox_id,
                command,
                output,
                exitCode: 0,
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.runCommandOnSandbox: Error running command on sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            return {
                sandbox_id,
                command,
                output: error.message,
                exitCode: 1,
            };
        }
    }

    async runCommandToGetLogsOnSandbox(
        sandbox_id: string,
        command: string,
        end_of_logs_keywords: string[],
    ) {
        const sandbox = await this.getConnection(sandbox_id);
        let allOutput = "";
        try {
            // Run the command
            const shell = await sandbox.commands.runBackground(command);

            this.logger.log({
                message: `${this.serviceName}.runCommandToGetLogsOnSandbox: Running command on sandbox`,
                metadata: {
                    sandbox_id,
                    command,
                    commandPromise: shell,
                },
            });

            let isResolved = false;

            const output = await new Promise((resolve) => {
                const timeoutId = setTimeout(() => {
                    if (allOutput && !isResolved) {
                        isResolved = true;
                        resolve(allOutput);
                    }
                }, 180000); // 3 minutes (180 seconds) timeout

                // Set up checking interval to verify if command has completed
                const checkInterval = setInterval(() => {
                    if (isResolved) {
                        clearInterval(checkInterval);
                        return;
                    }
                }, 5000); // Check every 5 seconds

                shell.onOutput((output) => {
                    allOutput += output + "\n";

                    if (
                        end_of_logs_keywords.some((keyword) =>
                            output.includes(keyword),
                        )
                    ) {
                        clearTimeout(timeoutId);
                        clearInterval(checkInterval);
                        isResolved = true;
                        resolve(allOutput);
                    }
                });
            });

            // Kill the shell after we've captured the output
            shell.kill();

            return {
                sandbox_id,
                command,
                output,
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.runCommandToGetLogsOnSandbox: Error running command on sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            return {
                sandbox_id,
                command,
                output: allOutput || error.message,
                exitCode: 1,
            };
        }
    }

    async killAllTerminals(sandbox_id: string) {
        try {
            const sandbox = await this.getConnection(sandbox_id);
            const terminals = await sandbox.terminals.getAll();
            for (const terminal of terminals) {
                await terminal.kill();
            }
            this.logger.log({
                message: `${this.serviceName}.killAllTerminals: Killed all terminals`,
                metadata: {
                    sandbox_id,
                },
            });
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.killAllTerminals: Error killing all terminals`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
        }
    }
}
