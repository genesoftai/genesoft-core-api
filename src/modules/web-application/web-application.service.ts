import { Injectable, Logger } from "@nestjs/common";
import { ProjectService } from "../project/project.service";
import { SupabaseService } from "../supabase/supabase.service";
import { FrontendInfraService } from "@/modules/frontend-infra/frontend-infra.service";
import { BackendInfraService } from "@/modules/backend-infra/backend-infra.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Iteration } from "../development/entity/iteration.entity";
import { Repository } from "typeorm";

@Injectable()
export class WebApplicationService {
    private readonly serviceName = "WebApplicationService";
    private readonly logger = new Logger(WebApplicationService.name);

    constructor(
        private readonly projectService: ProjectService,
        private readonly frontendInfraService: FrontendInfraService,
        private readonly backendInfraService: BackendInfraService,
        private readonly supabaseService: SupabaseService,
        @InjectRepository(Iteration)
        private iterationRepository: Repository<Iteration>,
    ) {}

    async getWebApplication(projectId: string) {
        const vercelProject =
            await this.frontendInfraService.getVercelProject(projectId);
        const previewTarget = vercelProject.targets["preview"];
        const vercelDomain =
            await this.frontendInfraService.getProjectDomain(projectId);

        this.logger.log({
            message: `${this.serviceName}.getWebApplication: Vercel domain`,
            metadata: { vercelDomain },
        });
        const status =
            previewTarget?.readyState === "READY" ? "deployed" : "not_deployed";
        let developmentStatus = "development_done";
        const iteration = await this.iterationRepository.findOne({
            where: { project_id: projectId },
            order: { created_at: "DESC" },
        });
        if (iteration && iteration.status === "in_progress") {
            developmentStatus =
                iteration.type === "feedback"
                    ? "feedback_iteration_in_progress"
                    : "requirements_iteration_in_progress";
        }
        const developmentDoneAt = iteration?.updated_at
            ? new Date(iteration.updated_at).getTime()
            : null;

        const url = `https://${vercelDomain.domains[0].name}`;
        // const url = `https://nextjs-web${projectId}.vercel.app`;

        // Status has to be one of the following:
        // - deployed
        // - not_deployed
        // - feedback_iteration_in_progress
        // - requirements_iteration_in_progress

        return {
            url,
            status,
            developmentStatus,
            developmentDoneAt,
            deploymentId: previewTarget?.deploymentId,
            readyAt: previewTarget?.readyAt,
        };
    }
}
