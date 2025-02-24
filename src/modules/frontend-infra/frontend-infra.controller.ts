import {
    Controller,
    Post,
    Body,
    Put,
    Get,
    Param,
    Delete,
} from "@nestjs/common";
import { FrontendInfraService } from "./frontend-infra.service";
import {
    CreateNewVercelProjectDto,
    CreateNewVercelProjectRecordDto,
} from "./dto/create-new-vercel-project.dto";
import {
    AddEnvironmentVariablesToVercelProjectDto,
    AddOneEnvironmentVariableToVercelProjectDto,
} from "./dto/update-vercel-project.dto";
import { CreateNewVercelDeploymentDto } from "./dto/create-new-deployment.dto";

@Controller("frontend-infra")
export class FrontendInfraController {
    constructor(private readonly frontendInfraService: FrontendInfraService) {}

    @Delete("project/:project_id/vercel")
    deleteVercelProject(@Param("project_id") project_id: string) {
        return this.frontendInfraService.deleteVercelProjectByProjectId(
            project_id,
        );
    }

    @Post("/vercel-project")
    createNewVercelProject(@Body() payload: CreateNewVercelProjectDto) {
        return this.frontendInfraService.createNewVercelProject(payload);
    }

    @Put("vercel-project/environment-variables")
    addEnvironmentVariablesToVercelProject(
        @Body() payload: AddEnvironmentVariablesToVercelProjectDto,
    ) {
        return this.frontendInfraService.addEnvironmentVariablesToVercelProject(
            payload,
        );
    }

    @Put("vercel-project/environment-variables/single")
    addOneEnvironmentVariableToVercelProject(
        @Body() payload: AddOneEnvironmentVariableToVercelProjectDto,
    ) {
        return this.frontendInfraService.addOneEnvironmentVariableToVercelProject(
            payload,
        );
    }

    @Post("vercel-project/record")
    createNewVercelProjectRecord(
        @Body() payload: CreateNewVercelProjectRecordDto,
    ) {
        return this.frontendInfraService.createNewVercelProjectRecord(payload);
    }

    @Get("vercel-deployment/:project_id")
    getLatestVercelDeployment(@Param("project_id") project_id: string) {
        return this.frontendInfraService.getLatestVercelDeployment(project_id);
    }

    @Post("vercel-deployment")
    createNewVercelDeployment(@Body() payload: CreateNewVercelDeploymentDto) {
        return this.frontendInfraService.createNewVercelDeployment(payload);
    }
}
