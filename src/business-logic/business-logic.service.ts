import { AiAgentConfigurationService } from "@/modules/configuration/ai-agent/ai-agent.service";
import { HttpService } from "@nestjs/axios";
import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { catchError, concatMap, lastValueFrom, of, retry } from "rxjs";
import { Repository } from "typeorm";
import { BusinessLogicAIAgentRequest } from "./entity/business-logic-ai-agent-request.entity";
import { BusinessLogicAIAgentRequestDto } from "./dto/business-logic-ai-agent.dto";

interface AIAgentExecuteRequest {
    project_id: string;
    input: string;
}

@Injectable()
export class BusinessLogicService {
    private readonly serviceName = "BusinessLogicService";
    private readonly logger = new Logger(this.serviceName);

    constructor(
        private readonly aiAgentConfigurationService: AiAgentConfigurationService,
        private readonly httpService: HttpService,
        @InjectRepository(BusinessLogicAIAgentRequest)
        private readonly businessLogicAIAgentRequestRepository: Repository<BusinessLogicAIAgentRequest>,
    ) {}

    private formatInputForAIAgent(
        payload: BusinessLogicAIAgentRequestDto,
    ): string {
        let input = "";
        if (payload.request) {
            input += `Request: ${payload.request}\n`;
        }
        if (payload.data) {
            input += `Data: ${payload.data}\n`;
        }
        if (payload.response) {
            input += `Expected Response Format: ${payload.response}`;
        }
        return input.trim();
    }

    private async executeAIAgentRequest({
        projectId,
        input,
        method,
        endpoint,
        request,
        data,
        response,
    }: {
        projectId: string;
        input: string;
        method: string;
        endpoint: string;
        request?: string;
        data?: string;
        response?: string;
    }) {
        try {
            const response = await lastValueFrom(
                this.httpService
                    .post(
                        `${this.aiAgentConfigurationService.genesoftAiAgentServiceBaseUrl}/api/business-logic-ai-agent/execute`,
                        {
                            project_id: projectId,
                            input: input,
                        } as AIAgentExecuteRequest,
                        {
                            headers: {
                                Authorization: `Bearer ${this.aiAgentConfigurationService.genesoftAiAgentServiceApiKey}`,
                            },
                        },
                    )
                    .pipe(
                        concatMap((res) => of(res.data)),
                        retry(2),
                        catchError((error) => {
                            this.logger.error({
                                message: `${this.serviceName}.executeAIAgentRequest: Error executing AI agent request`,
                                metadata: { error, projectId, input },
                            });
                            throw error;
                        }),
                    ),
            );

            // Create tracking record
            await this.businessLogicAIAgentRequestRepository.save({
                projectId,
                input,
                aiAgentResponse: JSON.stringify(response),
                statusCode: 200,
                method,
                endpoint,
                request,
                data,
                response,
            });

            return response;
        } catch (error) {
            // Create error tracking record
            await this.businessLogicAIAgentRequestRepository.save({
                projectId,
                input,
                errorMessage: error.message,
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                method,
                endpoint,
                request,
                data,
                response,
            });

            throw new HttpException(
                "Failed to process AI agent request",
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async getBusinessLogicAIAgent(
        projectId: string,
        request?: string,
        response?: string,
    ) {
        const input = this.formatInputForAIAgent({
            request,
            response,
        });
        return this.executeAIAgentRequest({
            projectId,
            input,
            method: "GET",
            endpoint: "/api/business-logic-ai-agent",
            request,
            response,
        });
    }

    async createBusinessLogicAIAgent(
        projectId: string,
        payload: BusinessLogicAIAgentRequestDto,
    ) {
        const input = this.formatInputForAIAgent(payload);
        return this.executeAIAgentRequest({
            projectId,
            input,
            method: "POST",
            endpoint: "/api/business-logic-ai-agent",
            request: payload.request,
            data: payload.data,
            response: payload.response,
        });
    }

    async updateBusinessLogicAIAgent(
        projectId: string,
        payload: BusinessLogicAIAgentRequestDto,
    ) {
        const input = this.formatInputForAIAgent(payload);
        return this.executeAIAgentRequest({
            projectId,
            input,
            method: "PUT",
            endpoint: "/api/business-logic-ai-agent",
            request: payload.request,
            data: payload.data,
            response: payload.response,
        });
    }

    async patchBusinessLogicAIAgent(
        projectId: string,
        payload: BusinessLogicAIAgentRequestDto,
    ) {
        const input = this.formatInputForAIAgent(payload);
        return this.executeAIAgentRequest({
            projectId,
            input,
            method: "PATCH",
            endpoint: "/api/business-logic-ai-agent",
            request: payload.request,
            data: payload.data,
            response: payload.response,
        });
    }

    async deleteBusinessLogicAIAgent(
        projectId: string,
        payload: BusinessLogicAIAgentRequestDto,
    ) {
        const input = this.formatInputForAIAgent(payload);
        return this.executeAIAgentRequest({
            projectId,
            input,
            method: "DELETE",
            endpoint: "/api/business-logic-ai-agent",
            request: payload.request,
            data: payload.data,
            response: payload.response,
        });
    }
}
