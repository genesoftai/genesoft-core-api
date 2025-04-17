import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
} from "@nestjs/common";
import { ProjectEnvManagementService } from "../project-env/project-env-management.service";
import {
    CreateProjectEnvDto,
    UpdateProjectEnvDto,
    ProjectEnvResponseDto,
} from "./dto/project-env.dto";
import { AuthGuard } from "../auth/auth.guard";

@Controller("projects/:projectId/envs")
@UseGuards(AuthGuard)
export class ProjectEnvController {
    constructor(
        private readonly projectEnvService: ProjectEnvManagementService,
    ) {}

    @Post()
    async create(
        @Param("projectId") projectId: string,
        @Body() createEnvDto: CreateProjectEnvDto,
    ): Promise<ProjectEnvResponseDto> {
        return this.projectEnvService.create(projectId, createEnvDto);
    }

    @Get()
    async findAll(
        @Param("projectId") projectId: string,
    ): Promise<ProjectEnvResponseDto[]> {
        return this.projectEnvService.findAll(projectId);
    }

    @Get(":id")
    async findOne(
        @Param("projectId") projectId: string,
        @Param("id") id: string,
    ): Promise<ProjectEnvResponseDto> {
        return this.projectEnvService.findOne(id, projectId);
    }

    @Put(":id")
    async update(
        @Param("projectId") projectId: string,
        @Param("id") id: string,
        @Body() updateEnvDto: UpdateProjectEnvDto,
    ): Promise<ProjectEnvResponseDto> {
        return this.projectEnvService.update(id, projectId, updateEnvDto);
    }

    @Delete(":id")
    async remove(
        @Param("projectId") projectId: string,
        @Param("id") id: string,
    ): Promise<void> {
        return this.projectEnvService.remove(id, projectId);
    }
}
