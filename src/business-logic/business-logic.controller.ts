import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Body,
    Query,
    Headers,
} from "@nestjs/common";
import { BusinessLogicService } from "./business-logic.service";

interface BusinessLogicAIAgentRequest {
    request?: string;
    data?: string;
    response?: string;
}

@Controller("business-logic-ai-agent")
export class BusinessLogicController {
    constructor(private readonly businessLogicService: BusinessLogicService) {}

    @Get()
    async getBusinessLogicAIAgent(
        @Headers("project_id") projectId: string,
        @Query("request") request?: string,
        @Query("response") response?: string,
    ) {
        return this.businessLogicService.getBusinessLogicAIAgent(
            projectId,
            request,
            response,
        );
    }

    @Post()
    async createBusinessLogicAIAgent(
        @Headers("project_id") projectId: string,
        @Body() data: BusinessLogicAIAgentRequest,
    ) {
        return this.businessLogicService.createBusinessLogicAIAgent(
            projectId,
            data,
        );
    }

    @Put()
    async updateBusinessLogicAIAgent(
        @Headers("project_id") projectId: string,
        @Body() data: BusinessLogicAIAgentRequest,
    ) {
        return this.businessLogicService.updateBusinessLogicAIAgent(
            projectId,
            data,
        );
    }

    @Patch()
    async patchBusinessLogicAIAgent(
        @Headers("project_id") projectId: string,
        @Body() data: BusinessLogicAIAgentRequest,
    ) {
        return this.businessLogicService.patchBusinessLogicAIAgent(
            projectId,
            data,
        );
    }

    @Delete()
    async deleteBusinessLogicAIAgent(
        @Headers("project_id") projectId: string,
        @Body() data: BusinessLogicAIAgentRequest,
    ) {
        return this.businessLogicService.deleteBusinessLogicAIAgent(
            projectId,
            data,
        );
    }
}
