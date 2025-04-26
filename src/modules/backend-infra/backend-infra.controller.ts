import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { BackendInfraService } from "./backend-infra.service";
import {
    CreateKoyebProjectDto,
    CreateKoyebServiceDto,
} from "./dto/create-koyeb-project.dto";

@Controller("backend-infra")
export class BackendInfraController {
    constructor(private readonly backendInfraService: BackendInfraService) {}

    @Get("project/:projectId")
    getBackendServiceInfo(@Param("projectId") projectId: string) {
        return this.backendInfraService.getBackendServiceInfo(projectId);
    }

    @Post("koyeb/project")
    createNewProjectInKoyeb(@Body() payload: CreateKoyebProjectDto) {
        return this.backendInfraService.createNewProjectInKoyeb(
            payload.projectId,
        );
    }

    @Delete("koyeb/project/:projectId")
    deleteKoyebProject(@Param("projectId") projectId: string) {
        return this.backendInfraService.deleteKoyebProject(projectId);
    }

    @Get("koyeb/project/:projectId/app")
    getKoyebAppByProjectId(@Param("projectId") projectId: string) {
        return this.backendInfraService.getKoyebAppByProjectId(projectId);
    }

    @Get("koyeb/project/:projectId/service")
    getKoyebServiceByProjectId(@Param("projectId") projectId: string) {
        return this.backendInfraService.getKoyebServiceByProjectId(projectId);
    }

    @Post("koyeb/service")
    createNewServiceInKoyeb(@Body() payload: CreateKoyebServiceDto) {
        return this.backendInfraService.runNewKoyebInstance(
            payload.appId,
            payload.projectId,
        );
    }
}
