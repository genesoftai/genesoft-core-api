import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ProjectService } from "./project.service";
import { CreateProjectDto } from "./dto/create-project.dto";

@Controller("project")
export class ProjectController {
    constructor(private readonly projectService: ProjectService) {}

    @Post()
    async createProject(@Body() payload: CreateProjectDto) {
        return this.projectService.createProject(payload);
    }

    @Get(":id")
    async getProjectById(@Param("id") id: string) {
        return this.projectService.getProjectById(id);
    }
}
