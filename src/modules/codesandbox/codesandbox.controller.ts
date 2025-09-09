import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Delete,
    Query,
} from "@nestjs/common";
import { CodesandboxService } from "./codesandbox.service";
import {
    CreateSandboxDto,
    CreateSandboxFromGitDto,
} from "./dto/create-sandbox.dto";
import {
    KillAllTerminalsDto,
    RunCommandOnSandboxDto,
    RunCommandToGetLogsOnSandboxDto,
} from "./dto/run-sandbox.dto";
import {
    WriteFileOnSandboxDto,
    ReadFileOnSandboxDto,
    DeleteFileOnSandboxDto,
    ListFilesOnSandboxDto,
    UploadFileOnSandboxDto,
    DownloadFileOnSandboxDto,
    RenameFileOnSandboxDto,
    CopyFileOnSandboxDto,
} from "./dto/file-systems.dto";

@Controller("codesandbox")
export class CodesandboxController {
    constructor(private readonly codesandboxService: CodesandboxService) {}

    @Post()
    async createSandbox(@Body() payload: CreateSandboxDto) {
        return this.codesandboxService.createSandbox(payload);
    }

    @Post("git")
    async createSandboxFromGit(@Body() payload: CreateSandboxFromGitDto) {
        return this.codesandboxService.createSandboxFromGit(payload);
    }

    @Get("file")
    async readFileFromSandbox(
        @Query("path") path: string,
        @Query("sandboxId") sandboxId: string,
    ) {
        return this.codesandboxService.readFileOnSandbox({
            sandbox_id: sandboxId,
            path,
        });
    }

    @Get(":id")
    async getSandbox(@Param("id") id: string) {
        return this.codesandboxService.getSandbox(id);
    }

    @Post(":id/stop")
    async stopSandbox(@Param("id") id: string) {
        return this.codesandboxService.stopSandbox(id);
    }

    @Post(":id/restart")
    async restartSandbox(@Param("id") id: string) {
        return this.codesandboxService.restartSandbox(id);
    }

    @Get(":id/tree")
    async getFileTreeFromSandbox(@Param("id") id: string) {
        return this.codesandboxService.getFileTreeFromSandbox(id);
    }

    @Get(":id/port/:port")
    async getPortInfoOnSandbox(
        @Param("id") id: string,
        @Param("port") port: number,
    ) {
        return this.codesandboxService.getPortInfoOnSandbox(id, port);
    }

    @Post(":id/pull")
    async pull(@Param("id") id: string) {
        try {
            return this.codesandboxService.runCommandOnSandbox({
                sandbox_id: id,
                command: "git pull",
            });
        } catch (error) {
            throw new Error(`Failed to decode token: ${error.message}`);
        }
    }

    @Post(":id/push")
    async push(@Param("id") id: string) {
        try {
            return this.codesandboxService.runCommandOnSandbox({
                sandbox_id: id,
                command: "git push",
            });
        } catch (error) {
            throw new Error(`Failed to decode token: ${error.message}`);
        }
    }

    @Post(":id/add")
    async add(@Param("id") id: string, @Body() payload: { path: string }) {
        try {
            return this.codesandboxService.runCommandOnSandbox({
                sandbox_id: id,
                command: `git add ${payload.path}`,
            });
        } catch (error) {
            throw new Error(`Failed to decode token: ${error.message}`);
        }
    }

    @Post(":id/commit")
    async commit(
        @Param("id") id: string,
        @Body() payload: { message: string },
    ) {
        try {
            return this.codesandboxService.runCommandOnSandbox({
                sandbox_id: id,
                command: `git commit -m '${payload.message}'`,
            });
        } catch (error) {
            throw new Error(`Failed to decode token: ${error.message}`);
        }
    }

    @Post(":id/connection/open")
    async openConnection(@Param("id") id: string) {
        return this.codesandboxService.createConnection(id);
    }

    @Post(":id/connection/close")
    async closeConnection(@Param("id") id: string) {
        return this.codesandboxService.closeConnection(id);
    }

    @Post("files/write")
    async writeFile(@Body() payload: WriteFileOnSandboxDto) {
        return this.codesandboxService.writeFileOnSandbox(payload);
    }

    @Post("files/read")
    async readFile(@Body() payload: ReadFileOnSandboxDto) {
        return this.codesandboxService.readFileOnSandbox(payload);
    }

    @Delete("files/delete")
    async deleteFile(@Body() payload: DeleteFileOnSandboxDto) {
        return this.codesandboxService.deleteFileOnSandbox(payload);
    }

    @Post("files/list")
    async listFiles(@Body() payload: ListFilesOnSandboxDto) {
        return this.codesandboxService.listFilesOnSandbox(payload);
    }

    @Post("files/upload")
    async uploadFile(@Body() payload: UploadFileOnSandboxDto) {
        return this.codesandboxService.uploadFileOnSandbox(payload);
    }

    @Post("files/download")
    async downloadFile(@Body() payload: DownloadFileOnSandboxDto) {
        return this.codesandboxService.downloadFileFromSandbox(payload);
    }

    @Post("files/rename")
    async renameFile(@Body() payload: RenameFileOnSandboxDto) {
        return this.codesandboxService.renameFileOnSandbox(payload);
    }

    @Post("files/copy")
    async copyFile(@Body() payload: CopyFileOnSandboxDto) {
        return this.codesandboxService.copyFileOnSandbox(payload);
    }

    @Post("command/run")
    async runCommand(@Body() payload: RunCommandOnSandboxDto) {
        return this.codesandboxService.runCommandOnSandbox(payload);
    }

    @Post("command/run/logs")
    async runCommandToGetLogs(
        @Body() payload: RunCommandToGetLogsOnSandboxDto,
    ) {
        return this.codesandboxService.runCommandToGetLogsOnSandbox(
            payload.sandbox_id,
            payload.command,
            payload.end_of_logs_keywords,
        );
    }

    @Post("terminals/kill/all")
    async killAllTerminals(@Body() payload: KillAllTerminalsDto) {
        return this.codesandboxService.killAllTerminals(payload.sandbox_id);
    }
}
