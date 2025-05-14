import { BadRequestException, Post, Get, Param, Controller, Body } from "@nestjs/common";
import { ProjectDbManagerService } from "../project-db/project-db-manager.service";
import { ProjectService } from "./project.service";
import { SubscriptionService } from "../subscription/subscription.service";
import { BackendInfraService } from "../backend-infra/backend-infra.service";

@Controller("projects")
export class ProjectIntegrationController  {
    constructor(
            private readonly projectDbManagerService: ProjectDbManagerService,
            private readonly subscriptionService: SubscriptionService,
            private readonly projectService: ProjectService,
            private readonly backendInfraService: BackendInfraService
    ) {}

    @Post(":id/database")
    async createProjectDatabase(@Param("id") id: string) {
        return this.projectDbManagerService.createProjectDatabase(id);
    }
    
    @Get(":id/database/disk-usage")
    async getProjectDatabaseDiskUsage(@Param("id") id: string) {
        return this.projectDbManagerService.getDatabaseDiskUsage(id);
    }

    @Get(":id/database/credentials")
    async getProjectDatabaseCredentials(@Param("id") id: string) {
        return this.projectDbManagerService.getProjectDatabaseCredentials(id);
    }

    @Get(":id/database/info")
    async getProjectDatabaseInfo(@Param("id") id: string) {
        return this.projectDbManagerService.getProjectDatabaseInfo(id);
    }

    @Post(":id/github-access")
    async requestGithubAccess(
        @Param("id") id: string,
        @Body() payload: { uid: string },
    ) {
        try {
            return this.projectService.requestGithubAccess(id, payload.uid);
        } catch (error) {
            throw new Error(`Failed to decode token: ${error.message}`);
        }
    }

    @Post(":id/services/re-deploy")
    async reDeployServices(@Param("id") id: string) {
        const subscriptions =
            await this.subscriptionService.getSubscriptionByProjectId(id);
        if (subscriptions.length === 0) {
            throw new BadRequestException(
                "Project is not a valid subscription",
            );
        }
        let validSubscription = false;
        for (const subscription of subscriptions) {
            if (
                (subscription.tier == "db-e1" ||
                    subscription.tier == "instance-e1") &&
                subscription.status == "active"
            ) {
                validSubscription = true;
            }
        }
        if (!validSubscription) {
            throw new BadRequestException(
                "Project is not a valid subscription",
            );
        }
        return this.backendInfraService.reDeployServices(id);
    }
}
