import { Body, Controller, Get, Param, Post, Delete } from "@nestjs/common";
import { CodesandboxService } from "./codesandbox.service";
import { CreateSandboxDto } from "./dto/create-sandbox.dto";
import {
    KillAllShellsDto,
    RunBuildTaskOnSandboxDto,
    RunCommandOnSandboxDto,
    RunDevTaskOnSandboxDto,
    RunTaskOnSandboxDto,
    RunInstallTaskOnSandboxDto,
    RunStartTaskOnSandboxDto,
} from "./dto/run-sandbox.dto";
import {
    WriteFileOnSandboxDto,
    ReadFileOnSandboxDto,
    DeleteFileOnSandboxDto,
    ListFilesOnSandboxDto,
    UploadFileOnSandboxDto,
    DownloadFileOnSandboxDto,
    RenameFileOnSandboxDto,
} from "./dto/file-systems.dto";

@Controller("codesandbox")
export class CodesandboxController {
    constructor(private readonly codesandboxService: CodesandboxService) {}

    @Post()
    async createSandbox(@Body() payload: CreateSandboxDto) {
        return this.codesandboxService.createSandbox(payload);
    }

    @Get(":id")
    async getSandbox(@Param("id") id: string) {
        return this.codesandboxService.getSandbox(id);
    }

    @Post(":id/start")
    async startSandbox(@Param("id") id: string) {
        return this.codesandboxService.startSandbox(id);
    }

    @Post(":id/stop")
    async stopSandbox(@Param("id") id: string) {
        return this.codesandboxService.stopSandbox(id);
    }

    @Post(":id/restart")
    async restartSandbox(@Param("id") id: string) {
        return this.codesandboxService.restartSandbox(id);
    }

    @Get(":id/port/:port")
    async getPortInfoOnSandbox(
        @Param("id") id: string,
        @Param("port") port: number,
    ) {
        return this.codesandboxService.getPortInfoOnSandbox(id, port);
    }

    @Post(":id/setup/web")
    async setupSandboxForWebProject(@Param("id") id: string) {
        return this.codesandboxService.setupSandboxForWebProject(id);
    }

    @Post(":id/setup/backend")
    async setupSandboxForBackendProject(@Param("id") id: string) {
        return this.codesandboxService.setupSandboxForBackendProject(id);
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

    @Post("command/run")
    async runCommand(@Body() payload: RunCommandOnSandboxDto) {
        return this.codesandboxService.runCommandOnSandbox(payload);
    }

    @Post("command/run/background")
    async runCommandWithoutWaiting(@Body() payload: RunCommandOnSandboxDto) {
        return this.codesandboxService.runCommandOnSandboxWithoutWaiting(
            payload,
        );
    }

    @Post("task/run")
    async runTask(@Body() payload: RunTaskOnSandboxDto) {
        return this.codesandboxService.runTaskOnSandbox(payload);
    }

    @Post("task/run/background")
    async runTaskAsBackgroundProcess(@Body() payload: RunTaskOnSandboxDto) {
        return this.codesandboxService.runTaskOnSandboxAsBackgroundProcess(
            payload,
        );
    }

    @Post("task/run/build")
    async runBuildTask(@Body() payload: RunBuildTaskOnSandboxDto) {
        return this.codesandboxService.runBuildTaskOnSandbox(
            payload.sandbox_id,
        );
    }

    @Post("task/run/dev")
    async runDevTask(@Body() payload: RunDevTaskOnSandboxDto) {
        return this.codesandboxService.runDevTaskOnSandbox(payload.sandbox_id);
    }

    @Post("task/run/install")
    async runInstallTask(@Body() payload: RunInstallTaskOnSandboxDto) {
        return this.codesandboxService.runInstallTaskOnSandbox(
            payload.sandbox_id,
        );
    }

    @Post("task/run/start")
    async runStartTask(@Body() payload: RunStartTaskOnSandboxDto) {
        return this.codesandboxService.runStartTaskOnSandbox(
            payload.sandbox_id,
        );
    }

    @Post("shells/kill/all")
    async killAllShells(@Body() payload: KillAllShellsDto) {
        return this.codesandboxService.killAllShells(payload.sandbox_id);
    }
}
