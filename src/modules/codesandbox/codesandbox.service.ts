import { Injectable, Logger } from "@nestjs/common";
import { CodeSandbox, VMTier } from "@codesandbox/sdk";
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

    async createSandbox(payload: CreateSandboxDto) {
        const sandbox = await this.sdk.sandbox.create({
            template: payload.template ?? CodesandboxTemplateId.NewNextJsShadcn,
            title: payload.title ?? "Next.js Shadcn",
            description: payload.description ?? "A sandbox for Next.js Shadcn",
            autoConnect: true,
            vmTier: VMTier.Nano,
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
        const result = await sandbox.setup.waitForFinish();
        this.logger.log({
            message: `${this.serviceName}: Setup result`,
            metadata: {
                result,
            },
        });

        await sandbox.hibernate();

        return {
            id,
            status: "created",
        };
    }

    async getSandbox(id: string) {
        const sandbox = await this.sdk.sandbox.open(id);
        this.logger.log({
            message: `${this.serviceName}: Sandbox`,
            metadata: {
                sandbox,
            },
        });

        try {
            const setup = sandbox.setup;
            this.logger.log({
                message: `${this.serviceName}: Setup`,
                metadata: {
                    setup,
                },
            });
            const ports = sandbox.ports.getOpenedPorts();
            this.logger.log({
                message: `${this.serviceName}: Ports`,
                metadata: {
                    ports,
                },
            });

            await sandbox.hibernate();
            return {
                setup,
                ports,
            };
        } catch (error) {
            await sandbox.hibernate();
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
        const sandbox = await this.sdk.sandbox.open(id);
        this.logger.log({
            message: `${this.serviceName}: Data`,
            metadata: {
                sandbox,
            },
        });

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
        const sandbox = await this.sdk.sandbox.open(id);
        try {
            await sandbox.shutdown();
            return {
                id,
                status: "stopped",
            };
        } catch (error) {
            await sandbox.hibernate();
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

    /**
     * Write text content to a file in the sandbox
     */
    async writeFileOnSandbox(payload: WriteFileOnSandboxDto) {
        const { sandbox_id, path, content } = payload;
        this.logger.log({
            message: `${this.serviceName}: Writing file on sandbox`,
            metadata: {
                sandbox_id,
                path,
                content,
            },
        });
        // const sandbox = await this.sdk.sandbox.open(sandbox_id);
        // const sandboxSession = await sandbox.sessions.create("write_file", {
        //     permission: "write",
        // });
        const sandbox = await this.sdk.sandbox.open(sandbox_id);

        this.logger.log({
            message: `${this.serviceName}: Sandbox started`,
            metadata: {
                sandbox_id,
            },
        });

        this.logger.log({
            message: `${this.serviceName}: Sandbox opened`,
            metadata: {
                sandbox_id,
                // sandboxSession,
            },
        });

        try {
            // Use sandbox.fs directly instead of creating a session
            await sandbox.fs.writeTextFile(path, content, {
                create: true,
                overwrite: true,
            });

            await sandbox.hibernate();

            this.logger.log({
                message: `${this.serviceName}: File written on sandbox`,
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
            // await sandbox.hibernate();
            this.logger.error({
                message: `${this.serviceName}: Error writing file on sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            throw error;
        }
    }

    async writeFileOnSandboxWithoutHibernate(payload: WriteFileOnSandboxDto) {
        const { sandbox_id, path, content } = payload;
        this.logger.log({
            message: `${this.serviceName}: Writing file on sandbox`,
            metadata: {
                sandbox_id,
                path,
                content,
            },
        });
        // const sandbox = await this.sdk.sandbox.open(sandbox_id);
        // const sandboxSession = await sandbox.sessions.create("write_file", {
        //     permission: "write",
        // });
        const sandbox = await this.sdk.sandbox.open(sandbox_id);

        this.logger.log({
            message: `${this.serviceName}: Sandbox started`,
            metadata: {
                sandbox_id,
            },
        });

        this.logger.log({
            message: `${this.serviceName}: Sandbox opened`,
            metadata: {
                sandbox_id,
                // sandboxSession,
            },
        });

        try {
            // Use sandbox.fs directly instead of creating a session
            await sandbox.fs.writeTextFile(path, content, {
                create: true,
                overwrite: true,
            });

            this.logger.log({
                message: `${this.serviceName}: File written on sandbox`,
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
            // await sandbox.hibernate();
            this.logger.error({
                message: `${this.serviceName}: Error writing file on sandbox`,
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
        const sandbox = await this.sdk.sandbox.open(sandbox_id);
        this.logger.log({
            message: `${this.serviceName}: Reading file on sandbox`,
            metadata: {
                sandbox_id,
                path,
                sandbox,
            },
        });
        try {
            const content = await sandbox.fs.readTextFile(path);
            await sandbox.hibernate();
            return {
                sandbox_id,
                path,
                status: "file_read",
                content,
            };
        } catch (error) {
            await sandbox.hibernate();
            this.logger.error({
                message: `${this.serviceName}: Error reading file on sandbox`,
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
    async readFileOnSandboxWithoutHibernate(payload: ReadFileOnSandboxDto) {
        const { sandbox_id, path } = payload;
        const sandbox = await this.sdk.sandbox.open(sandbox_id);
        this.logger.log({
            message: `${this.serviceName}: Reading file on sandbox`,
            metadata: {
                sandbox_id,
                path,
                sandbox,
            },
        });
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
                message: `${this.serviceName}: Error reading file on sandbox`,
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
        const sandbox = await this.sdk.sandbox.open(sandbox_id);
        try {
            await sandbox.fs.remove(path);
            await sandbox.hibernate();
            return {
                sandbox_id,
                path,
                status: "file_deleted",
            };
        } catch (error) {
            await sandbox.hibernate();
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
        const sandbox = await this.sdk.sandbox.open(sandbox_id);
        try {
            const files = await sandbox.fs.readdir(path);
            await sandbox.hibernate();
            return {
                sandbox_id,
                path,
                files,
            };
        } catch (error) {
            await sandbox.hibernate();
            this.logger.error({
                message: `${this.serviceName}: Error listing files on sandbox`,
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
        const sandbox = await this.sdk.sandbox.open(sandbox_id);
        try {
            await sandbox.fs.writeFile(path, content);
            await sandbox.hibernate();
            return {
                sandbox_id,
                path,
                status: "file_uploaded",
            };
        } catch (error) {
            await sandbox.hibernate();
            this.logger.error({
                message: `${this.serviceName}: Error uploading file on sandbox`,
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
        const sandbox = await this.sdk.sandbox.open(sandbox_id);
        try {
            const { downloadUrl } = await sandbox.fs.download(path);
            await sandbox.hibernate();
            return {
                sandbox_id,
                path,
                downloadUrl,
            };
        } catch (error) {
            await sandbox.hibernate();
            this.logger.error({
                message: `${this.serviceName}: Error downloading file from sandbox`,
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
        const sandbox = await this.sdk.sandbox.open(sandbox_id);
        try {
            await sandbox.fs.rename(old_path, new_path);
            await sandbox.hibernate();
            return {
                sandbox_id,
                old_path,
                new_path,
                status: "file_renamed",
            };
        } catch (error) {
            await sandbox.hibernate();
            this.logger.error({
                message: `${this.serviceName}: Error renaming file on sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            throw error;
        }
    }

    async getPortInfoOnSandbox(sandbox_id: string, port: number) {
        const sandbox = await this.sdk.sandbox.open(sandbox_id);
        this.logger.log({
            message: `${this.serviceName}: Getting port info on sandbox`,
            metadata: {
                sandbox_id,
                port,
            },
        });

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

            this.logger.log({
                message: `${this.serviceName}: Preview URL`,
                metadata: {
                    sandbox_id,
                    port,
                    openPorts,
                    result,
                },
            });

            await sandbox.hibernate();

            return {
                sandbox_id,
                port,
                openPorts,
                result,
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}: Error getting port info on sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            throw error;
        }
    }

    async runCommandOnSandbox(payload: RunCommandOnSandboxDto) {
        const { sandbox_id, command } = payload;
        const sandbox = await this.sdk.sandbox.open(sandbox_id);
        try {
            // Run the command
            const shell = sandbox.shells.run(command);

            let allOutput = "";

            const output = await new Promise((resolve) => {
                shell.onOutput((output) => {
                    console.log(output);

                    // Accumulate all output
                    allOutput += output + "\n";
                });

                // Set a timeout in case the command doesn't complete normally
                setTimeout(() => {
                    if (allOutput) {
                        resolve(allOutput);
                    }
                }, 30000); // 30 seconds timeout

                // When command completes
                shell.then(() => {
                    resolve(allOutput);
                });
            });

            // Wait for completion and get results
            const result = await shell;

            this.logger.log({
                message: `${this.serviceName}: Command executed on sandbox`,
                metadata: {
                    sandbox_id,
                    command,
                    exitCode: result.exitCode,
                },
            });

            shell.kill();
            await sandbox.hibernate();

            return {
                sandbox_id,
                command,
                output,
                exitCode: result.exitCode,
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}: Error running command on sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            await sandbox.hibernate();
            throw error;
        }
    }

    async runCommandOnSandboxWithoutWaiting(payload: RunCommandOnSandboxDto) {
        const { sandbox_id, command } = payload;
        const sandbox = await this.sdk.sandbox.open(sandbox_id);
        try {
            // Run the command
            sandbox.shells.run(command);

            return {
                sandbox_id,
                command,
                status: "command_running",
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}: Error running command on sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            await sandbox.hibernate();
            throw error;
        }
    }

    async runTaskOnSandbox(payload: RunTaskOnSandboxDto) {
        const { sandbox_id, task } = payload;
        this.logger.log({
            message: `${this.serviceName}: Attempting to run task on sandbox`,
            metadata: {
                sandbox_id,
                task,
            },
        });
        const sandbox = await this.sdk.sandbox.open(sandbox_id);
        try {
            const result = await sandbox.tasks.runTask(task);
            let port = null;
            // If the task opens a port, you can access it
            if (result.ports.length > 0) {
                port = result.ports[0];
                console.log(`Preview available at: ${port.getPreviewUrl()}`);
            }

            this.logger.log({
                message: `${this.serviceName}: Task result`,
                metadata: {
                    result,
                    port,
                },
            });
            await sandbox.hibernate();
            return result;
        } catch (error) {
            await sandbox.hibernate();
            this.logger.error({
                message: `${this.serviceName}: Error running task on sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
        }
    }

    async runTaskOnSandboxAsBackgroundProcess(payload: RunTaskOnSandboxDto) {
        const { sandbox_id, task } = payload;
        this.logger.log({
            message: `${this.serviceName}: Attempting to run task on sandbox`,
            metadata: {
                sandbox_id,
                task,
            },
        });
        const sandbox = await this.sdk.sandbox.open(sandbox_id);
        try {
            const result = await sandbox.tasks.runTask(task);
            return {
                sandbox_id,
                task,
                status: "task_running",
                result,
            };
        } catch (error) {
            await sandbox.hibernate();
            this.logger.error({
                message: `${this.serviceName}: Error running task on sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
        }
    }

    async runBuildTaskOnSandbox(sandbox_id: string) {
        const sandbox = await this.sdk.sandbox.open(sandbox_id);
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
                    console.log(output);

                    // Accumulate all output
                    allOutput += output + "\n";

                    // Check if build is complete
                    if (
                        output.includes("✓ built in") ||
                        output.includes("Build failed")
                    ) {
                        resolve(allOutput);
                    }
                });

                // Set a timeout in case the build doesn't complete normally
                setTimeout(() => {
                    if (allOutput) {
                        resolve(allOutput);
                    }
                }, 30000); // 30 seconds timeout
            });

            await shell.kill();
            await sandbox.hibernate();

            return {
                sandbox_id,
                task,
                output,
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}: Error getting run build task info`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            await sandbox.hibernate();
            throw error;
        }
    }

    async runDevTaskOnSandbox(sandbox_id: string) {
        const sandbox = await this.sdk.sandbox.open(sandbox_id);
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
                    console.log(output);

                    // Accumulate all output
                    allOutput += output + "\n";

                    // Check if dev server is ready
                    if (
                        output.includes("ready in") ||
                        output.includes("Local:") ||
                        output.includes("localhost:") ||
                        output.includes("started server on") ||
                        output.includes("Nest application successfully started")
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
            await sandbox.hibernate();

            return {
                sandbox_id,
                task,
                output,
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}: Error running dev task on sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            await sandbox.hibernate();
            throw error;
        }
    }

    async runPreviewTaskOnSandbox(sandbox_id: string) {
        const sandbox = await this.sdk.sandbox.open(sandbox_id);
        try {
            const task = await sandbox.tasks.getTask("preview");
            if (!task) {
                throw new Error("Preview task not found");
            }
            const taskResult = await sandbox.tasks.runTask(task.id);
            const shell = await sandbox.shells.open(taskResult.shellId);

            let allOutput = "";

            const output = await new Promise((resolve) => {
                shell.onOutput((output) => {
                    console.log(output);

                    // Accumulate all output
                    allOutput += output + "\n";

                    // Check if dev server is ready
                    if (
                        output.includes("ready in") ||
                        output.includes("Local:") ||
                        output.includes("localhost:") ||
                        output.includes("started server on")
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
            await sandbox.hibernate();

            return {
                sandbox_id,
                task,
                output,
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}: Error running dev task on sandbox`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
            await sandbox.hibernate();
            throw error;
        }
    }

    async killAllShells(sandbox_id: string) {
        try {
            const sandbox = await this.sdk.sandbox.open(sandbox_id);
            const shells = await sandbox.shells.getShells();
            for (const shell of shells) {
                this.logger.log({
                    message: `${this.serviceName}: Killing shell`,
                    metadata: {
                        shell_id: shell.id,
                        sandbox_id,
                        name: shell.name,
                        output: shell.getOutput(),
                    },
                });
                await shell.kill();
            }
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}: Error killing all shells`,
                metadata: {
                    error: error.message,
                    stack: error.stack,
                },
            });
        }
    }
}
