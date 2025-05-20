import { Injectable, Logger } from "@nestjs/common";
import { CodeSandbox, Sandbox, VMTier } from "@codesandbox/sdk";
import { ThirdPartyConfigurationService } from "../configuration/third-party/third-party.service";
import { CreateSandboxDto } from "./dto/create-sandbox.dto";
import { CodesandboxTemplateId } from "../constants/codesandbox";
import {
    DeleteFileOnSandboxDto,
    DownloadFileOnSandboxDto,
    ListFilesOnSandboxDto,
    ReadFileOnSandboxDto,
    RenameFileOnSandboxDto,
    UploadFileOnSandboxDto,
    WriteFileOnSandboxDto,
} from "./dto/file-systems.dto";
import {
    RunCommandOnSandboxDto,
    RunTaskOnSandboxDto,
} from "./dto/run-sandbox.dto";
import { HttpService } from "@nestjs/axios";

@Injectable()
export class CodesandboxService {
    sandboxClients: Map<string, Sandbox> = new Map();
    sdk: CodeSandbox;
    private readonly logger = new Logger(CodesandboxService.name);
    private readonly serviceName = CodesandboxService.name;

    constructor(
        private readonly thirdPartyConfigurationService: ThirdPartyConfigurationService,
        private readonly httpService: HttpService,
    ) {
        this.sdk = new CodeSandbox(
            this.thirdPartyConfigurationService.codesandboxApiKey,
        );
    }

    async createConnection(sandboxId: string) {
        const sandbox = await this.sdk.sandbox.open(sandboxId);
        this.sandboxClients.set(sandboxId, sandbox);
        return sandbox;
    }

    async getConnection(sandboxId: string) {
        if (this.sandboxClients.has(sandboxId)) {
            return this.sandboxClients.get(sandboxId);
        }
        return this.createConnection(sandboxId);
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
        const sandbox = await this.sdk.sandbox.create({
            template: payload.template ?? CodesandboxTemplateId.NewNextJsShadcn,
            title: payload.title ?? "Next.js Shadcn",
            description: payload.description ?? "A sandbox for Next.js Shadcn",
            autoConnect: true,
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
        // // Listen to setup progress
        // sandbox.setup.onSetupProgressUpdate((progress) => {
        //     console.log(
        //         `Setup progress: ${progress.currentStepIndex + 1}/${progress.steps.length}`,
        //     );
        //     console.log(
        //         `Current step: ${progress.steps[progress.currentStepIndex].name}`,
        //     );
        // });

        // // Get current progress
        // const progress = await sandbox.setup.getProgress();
        // console.log(`Setup state: ${progress.state}`);
        // const result = await sandbox.setup.waitForFinish();

        // await sandbox.hibernate();

        return {
            id,
            status: "created",
        };
    }

    async getSandbox(id: string) {
        const sandbox = await this.sdk.sandbox.open(id);

        try {
            const setup = sandbox.setup;

            const ports = sandbox.ports.getOpenedPorts();
            return {
                setup,
                ports,
            };
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

    async startSandbox(id: string) {
        // const data = await this.sdk.sandbox.start(id);
        const sandbox = await this.getConnection(id);

        // Listen to setup progress
        sandbox.setup.onSetupProgressUpdate((progress) => {
            console.log(
                `Setup progress: ${progress.currentStepIndex + 1}/${progress.steps.length}`,
            );
            console.log(
                `Current step: ${progress.steps[progress.currentStepIndex].name}`,
            );
        });

        // Get current progress
        const progress = await sandbox.setup.getProgress();
        console.log(`Setup state: ${progress.state}`);

        // Wait for setup to finish
        const result = await sandbox.setup.waitForFinish();
        if (result.state === "FINISHED") {
            console.log("Setup completed successfully");
        }

        try {
            return {
                id,
                status: "started",
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}: Error starting sandbox`,
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
            await sandbox.shutdown();
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
            await this.startSandbox(id);
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
        const ignoreDir = ["node_modules"];
        const sandbox = await this.getConnection(id);
        const entries = await sandbox.fs.readdir(path);
        const files = [];
        for (const entry of entries) {
            const fullPath =
                path === "/" ? `/${entry.name}` : `${path}/${entry.name}`;

            if (entry.type === "directory" && !ignoreDir.includes(entry.name)) {
                const subFiles = await this.getFileTreeFromSandbox(
                    id,
                    fullPath,
                );
                files.push(...subFiles);
            } else {
                files.push({
                    path: fullPath,
                    type: "file",
                    name: entry.name,
                });
            }
        }
        return files;
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
            return {
                sandbox_id,
                path,
                files,
            };
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

    async getPortInfoOnSandbox(sandbox_id: string, port: number) {
        const sandbox = await this.getConnection(sandbox_id);

        try {
            // Get all opened ports
            const openPorts = sandbox.ports.getOpenedPorts();
            let hostname = "";
            for (const port of openPorts) {
                console.log(`Port ${port.port} is open at ${port.hostname}`);
                if (port.port.toString() === port.toString()) {
                    hostname = port.hostname;
                }
            }
            if (!hostname) {
                throw new Error("No hostname found");
            }

            const result = await this.httpService.get(
                `http://${hostname}:${port}`,
            );

            return {
                sandbox_id,
                port,
                openPorts,
                result,
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
        let { sandbox_id, command } = payload;
        const sandbox = await this.getConnection(sandbox_id);
        try {
            // Run the command with a timeout of 180 seconds
            command = `cd app && ${command}`;
            const shellPromise = sandbox.shells.run(command);
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

            const shell = await Promise.race([shellPromise, timeoutPromise]);
            return {
                sandbox_id,
                command,
                output: shell?.output,
                exitCode: shell?.exitCode,
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.runCommandOnSandbox: Error running command on sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            throw error;
        }
    }

    async runCommandOnSandboxWithoutWaiting(payload: RunCommandOnSandboxDto) {
        let { sandbox_id, command } = payload;
        const sandbox = await this.getConnection(sandbox_id);
        try {
            // Run the command
            command = `cd app && ${command}`;
            sandbox.shells.run(command);

            return {
                sandbox_id,
                command,
                status: "command_running",
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.runCommandOnSandboxWithoutWaiting: Error running command on sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            throw error;
        }
    }

    async runTaskOnSandbox(payload: RunTaskOnSandboxDto) {
        const { sandbox_id, task } = payload;

        const sandbox = await this.getConnection(sandbox_id);
        try {
            // Create a promise that will resolve with the task result or reject after 1 minute
            const taskPromise = sandbox.tasks.runTask(task);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(
                    () =>
                        reject(
                            new Error(
                                "Task execution timed out after 1 minute",
                            ),
                        ),
                    60000,
                );
            });

            const result = await Promise.race([taskPromise, timeoutPromise]);

            this.logger.log({
                message: `${this.serviceName}.runTaskOnSandbox: Task ${task} running on sandbox ${sandbox_id}`,
                metadata: {
                    result,
                },
            });
            return result;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.runTaskOnSandbox: Error running task on sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            return {
                sandbox_id,
                task,
                status: "task_failed",
                error: error.message,
            };
        }
    }

    async runTaskOnSandboxAsBackgroundProcess(payload: RunTaskOnSandboxDto) {
        const { sandbox_id, task } = payload;

        const sandbox = await this.getConnection(sandbox_id);
        try {
            const result = await sandbox.tasks.runTask(task);
            return {
                sandbox_id,
                task,
                status: "task_running",
                result,
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.runTaskOnSandboxAsBackgroundProcess: Error running task on sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
        }
    }

    async runBuildTaskOnSandbox(sandbox_id: string) {
        const sandbox = await this.getConnection(sandbox_id);
        try {
            const task = await sandbox.tasks.getTask("build");
            if (!task) {
                throw new Error("Build task not found");
            }
            const taskResult = await sandbox.tasks.runTask(task.id);
            const shell = await sandbox.shells.open(taskResult.shellId);

            let allOutput = "";

            const output = await new Promise((resolve) => {
                shell.onOutput((output) => {
                    // Accumulate all output
                    allOutput += output + "\n";

                    if (shell.exitCode) {
                        resolve(allOutput);
                    }

                    // Check if build is complete
                    if (
                        output.includes("✓ built in") ||
                        output.includes("Build failed") ||
                        output.includes("Command failed with exit code") ||
                        output.includes(
                            "npm ERR! A complete log of this run can be found in",
                        )
                    ) {
                        resolve(allOutput);
                    }
                });

                // Set a timeout in case the build doesn't complete normally
                setTimeout(() => {
                    if (allOutput) {
                        resolve(allOutput);
                    }
                }, 180000); // 180 seconds timeout
            });

            // Kill the shell after we've captured the output
            await shell.kill();
            return {
                sandbox_id,
                task,
                output,
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.runBuildTaskOnSandbox: Error getting run build task info`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            return {
                sandbox_id,
                task: "build",
                output: "Can't get build task info",
            };
        }
    }

    async runDevTaskOnSandbox(sandbox_id: string) {
        const sandbox = await this.getConnection(sandbox_id);
        try {
            const task = await sandbox.tasks.getTask("dev");
            if (!task) {
                throw new Error("Dev task not found");
            }
            const taskResult = await sandbox.tasks.runTask(task.id);
            const shell = await sandbox.shells.open(taskResult.shellId);

            let allOutput = "";

            const output = await new Promise((resolve) => {
                shell.onOutput((output) => {
                    // Accumulate all output
                    allOutput += output + "\n";

                    // Check if dev server is ready
                    if (
                        output.includes("ready in") ||
                        output.includes("Local:") ||
                        output.includes("localhost:") ||
                        output.includes("started server on") ||
                        output.includes(
                            "Nest application successfully started",
                        ) ||
                        output.includes("Command failed with exit code") ||
                        output.includes("erros. Watching for file changes") ||
                        output.includes(
                            "npm ERR! A complete log of this run can be found in",
                        )
                    ) {
                        resolve(allOutput);
                    }
                });

                // Set a timeout in case the dev server doesn't report ready
                setTimeout(() => {
                    if (allOutput) {
                        resolve(allOutput);
                    }
                }, 120000); // 120 seconds timeout
            });

            // Kill the shell after we've captured the output
            await shell.kill();
            return {
                sandbox_id,
                task,
                output,
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.runDevTaskOnSandbox: Error running dev task on sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            return {
                sandbox_id,
                task: "dev",
                output: "Can't get dev task info",
            };
        }
    }

    async runInstallTaskOnSandbox(sandbox_id: string) {
        const sandbox = await this.getConnection(sandbox_id);
        try {
            const task = await sandbox.tasks.getTask("install");
            if (!task) {
                throw new Error("Install task not found");
            }
            const taskResult = await sandbox.tasks.runTask(task.id);
            const shell = await sandbox.shells.open(taskResult.shellId);

            let allOutput = "";

            const output = await new Promise((resolve) => {
                shell.onOutput((output) => {
                    // Accumulate all output
                    allOutput += output + "\n";

                    // Check if dev server is ready
                    if (
                        output.includes("Done in") ||
                        output.includes("Command failed with exit code") ||
                        output.includes(
                            "npm ERR! A complete log of this run can be found in",
                        )
                    ) {
                        resolve(allOutput);
                    }
                });

                // Set a timeout in case the dev server doesn't report ready
                setTimeout(() => {
                    if (allOutput) {
                        resolve(allOutput);
                    }
                }, 180000); // 180 seconds timeout
            });

            // Kill the shell after we've captured the output
            await shell.kill();
            return {
                sandbox_id,
                task,
                output,
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.runInstallTaskOnSandbox: Error running install task on sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            return {
                sandbox_id,
                task: "install",
                output: "Can't get install task info",
            };
        }
    }

    async runStartTaskOnSandbox(sandbox_id: string) {
        const sandbox = await this.getConnection(sandbox_id);
        try {
            const task = await sandbox.tasks.getTask("start");
            if (!task) {
                throw new Error("Start task not found");
            }
            const taskResult = await sandbox.tasks.runTask(task.id);
            const shell = await sandbox.shells.open(taskResult.shellId);

            let allOutput = "";

            const output = await new Promise((resolve) => {
                shell.onOutput((output) => {
                    // Accumulate all output
                    allOutput += output + "\n";

                    // Check if dev server is ready
                    if (
                        output.includes("✓ Ready in") ||
                        output.includes(
                            "Nest application successfully started",
                        ) ||
                        output.includes("Command failed with exit code")
                    ) {
                        resolve(allOutput);
                    }
                });

                // Set a timeout in case the dev server doesn't report ready
                setTimeout(() => {
                    if (allOutput) {
                        resolve(allOutput);
                    }
                }, 30000); // 30 seconds timeout
            });

            // Kill the shell after we've captured the output
            await shell.kill();
            return {
                sandbox_id,
                task,
                output,
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.runStartTaskOnSandbox: Error running start task on sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            return {
                sandbox_id,
                task: "start",
                output: "Can't get start task info",
            };
        }
    }

    async runCommandToGetLogsOnSandbox(
        sandbox_id: string,
        command: string,
        end_of_logs_keywords: string[],
    ) {
        const sandbox = await this.sdk.sandbox.open(sandbox_id);
        try {
            // Run the command
            const shell = sandbox.shells.run(command);

            this.logger.log({
                message: `${this.serviceName}.runCommandToGetLogsOnSandbox: Running command on sandbox`,
                metadata: {
                    sandbox_id,
                    command,
                    shell,
                },
            });

            let allOutput = "";
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
                        // output.includes("ready in") ||
                        // output.includes("Local:") ||
                        // output.includes("localhost:") ||
                        // output.includes("started server on") ||
                        // output.includes(
                        //     "Nest application successfully started",
                        // ) ||
                        // output.includes("Command failed with exit code") ||
                        // output.includes("errors. Watching for file changes") ||
                        // output.includes(
                        //     "npm ERR! A complete log of this run can be found in",
                        // )
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
                output: "Can't execute command on sandbox",
                exitCode: 1,
            };
        }
    }

    async killAllShells(sandbox_id: string) {
        try {
            const sandbox = await this.getConnection(sandbox_id);
            const shells = await sandbox.shells.getShells();
            for (const shell of shells) {
                await shell.kill();
            }
            this.logger.log({
                message: `${this.serviceName}: Killed all shells`,
                metadata: {
                    sandbox_id,
                },
            });
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.killAllShells: Error killing all shells`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
        }
    }

    async setupSandboxForWebProject(sandbox_id: string) {
        this.logger.log({
            message: `${this.serviceName}.setupSandboxForWebProject: Setting up sandbox for web project`,
            metadata: {
                sandbox_id,
            },
        });
        try {
            const killShells = await this.killAllShells(sandbox_id);
            // const installTask = await this.runInstallTaskOnSandbox(sandbox_id);
            await this.runCommandOnSandboxWithoutWaiting({
                sandbox_id,
                command: "cd app && pnpm install",
            });
            await this.runCommandOnSandboxWithoutWaiting({
                sandbox_id,
                command: "cd app && pnpm run dev",
            });
            this.logger.log({
                message: `${this.serviceName}.setupSandboxForWebProject: Setup sandbox for web project finished`,
                metadata: {
                    sandbox_id,
                },
            });
            return {
                sandbox_id,
                status: "setup_finished",
                killShells,
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.setupSandboxForWebProject: Error setting up sandbox for web iteration`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            return {
                sandbox_id,
                status: "setup_failed",
            };
        }
    }

    async setupSandboxForBackendProject(sandbox_id: string) {
        this.logger.log({
            message: `${this.serviceName}.setupSandboxForBackendProject: Setting up sandbox for backend project`,
            metadata: {
                sandbox_id,
            },
        });
        await this.getConnection(sandbox_id);
        try {
            await this.killAllShells(sandbox_id);
            await this.runCommandOnSandboxWithoutWaiting({
                sandbox_id,
                command: "cd app && pnpm install",
            });
            await this.runCommandOnSandboxWithoutWaiting({
                sandbox_id,
                command: "cd app && pnpm run start:dev",
            });
            this.logger.log({
                message: `${this.serviceName}.setupSandboxForBackendProject: Setup sandbox for backend project finished`,
                metadata: {
                    sandbox_id,
                },
            });
            return {
                sandbox_id,
                status: "setup_finished",
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.setupSandboxForBackendProject: Error setting up sandbox for web iteration`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            return {
                sandbox_id,
                status: "setup_failed",
            };
        }
    }
}
