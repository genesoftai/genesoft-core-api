import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { IntegrationService } from "./integration.service";
import { UpdateEnvironmentVariablesDto } from "./dto/update-env-vars.dto";

@Controller("integration")
export class IntegrationController {
    constructor(private readonly integrationService: IntegrationService) {}

    @Get("vercel/:project_id/env-vars")
    getVercelProjectEnvVars(@Param("project_id") project_id: string) {
        return this.integrationService.getVercelProjectEnvVars(project_id);
    }

    @Patch("vercel/:project_id/env-vars")
    updateEnvironmentVariables(@Body() payload: UpdateEnvironmentVariablesDto) {
        return this.integrationService.updateEnvironmentVariables(payload);
    }

    @Get("vercel/:project_id/env-vars/firebase")
    getFirebaseProjectEnvVars(@Param("project_id") project_id: string) {
        return this.integrationService.getFirebaseProjectEnvVars(project_id);
    }

    @Get("vercel/:project_id/env-vars/stripe")
    getStripeProjectEnvVars(@Param("project_id") project_id: string) {
        return this.integrationService.getStripeProjectEnvVars(project_id);
    }
}
