import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Logger } from "@nestjs/common";
import { BackendInfraService } from "../backend-infra/backend-infra.service";
import { SubscriptionService } from "../subscription/subscription.service";
import { ProjectDbManagerService } from "../project-db/project-db-manager.service";
@Processor("on-subscription-completed")
export class ProjectIntegrationProcessor extends WorkerHost {
    constructor(
        private readonly backendInfraService: BackendInfraService,
        private readonly subscriptionService: SubscriptionService,
        private readonly projectDbManagerService: ProjectDbManagerService,
    ) {
        super();
    }

    async process(job: Job<any>): Promise<any> {
        Logger.log(`Processing job ${job.id}`);
        switch (job.name) {
            case "onSubscriptionCompletedQueue_instance-e1":
                await this.processInstanceE1(job);
                break;
            case "onSubscriptionCompletedQueue_db-e1":
                await this.processDbE1(job);
                break;
        }
    }

    async processInstanceE1(job: Job<any>): Promise<any> {
      const { checkoutSession } = job.data;
        await this.subscriptionService.createSubscriptionByCheckoutSession(
          {
              sessionId: checkoutSession.id,
              tier: "instance-e1",
          },
      );

      await this.backendInfraService.createNewProjectInKoyeb(
          checkoutSession.metadata.projectId,
      );
    }

    async processDbE1(job: Job<any>): Promise<any> {
      const { checkoutSession } = job.data;
      await this.subscriptionService.createSubscriptionByCheckoutSession(
        {
            sessionId: checkoutSession.id,
            tier: "db-e1",
        },
      );

      await Promise.all([
          this.backendInfraService.createNewProjectInKoyeb(
              checkoutSession.metadata.projectId,
          ),
          this.projectDbManagerService.createProjectDatabase(
              checkoutSession.metadata.projectId,
          ),
      ]);
    }
}
