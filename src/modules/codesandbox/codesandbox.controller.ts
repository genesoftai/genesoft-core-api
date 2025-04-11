import { Body, Controller, Get, Param, Post, Delete } from "@nestjs/common";
import { CodesandboxService } from "./codesandbox.service";
import { CreateSandboxDto } from "./dto/create-sandbox.dto";
import {
    KillAllShellsDto,
    RunBuildTaskOnSandboxDto,
    RunCommandOnSandboxDto,
    RunDevTaskOnSandboxDto,
    RunPreviewTaskOnSandboxDto,
    RunTaskOnSandboxDto,
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

    @Get(":id/port/:port")
    async getPortInfoOnSandbox(
        @Param("id") id: string,
        @Param("port") port: number,
    ) {
        return this.codesandboxService.getPortInfoOnSandbox(id, port);
    }

    @Post("files/write")
    async writeFile(@Body() payload: WriteFileOnSandboxDto) {
        return this.codesandboxService.writeFileOnSandbox(payload);
    }

    @Post("files/write/fast")
    async writeFileWithoutHibernate(@Body() payload: WriteFileOnSandboxDto) {
        return this.codesandboxService.writeFileOnSandboxWithoutHibernate(
            payload,
        );
    }

    @Post("files/read")
    async readFile(@Body() payload: ReadFileOnSandboxDto) {
        return this.codesandboxService.readFileOnSandbox(payload);
    }

    @Post("files/read/fast")
    async readFileWithoutHibernate(@Body() payload: ReadFileOnSandboxDto) {
        return this.codesandboxService.readFileOnSandboxWithoutHibernate(
            payload,
        );
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

    @Post("task/run/preview")
    async runPreviewTask(@Body() payload: RunPreviewTaskOnSandboxDto) {
        return this.codesandboxService.runPreviewTaskOnSandbox(
            payload.sandbox_id,
        );
    }

    @Post("shells/kill/all")
    async killAllShells(@Body() payload: KillAllShellsDto) {
        return this.codesandboxService.killAllShells(payload.sandbox_id);
    }
}

// TODO: list about tools for ai agent
// - list all files in the sandbox
// - read a file
// - write a file
// - delete a file
// - rename a file
// - run a command
// - run a task
// - run a build task
// - run a dev task
// - run a preview task
