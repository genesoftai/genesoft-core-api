import { EmailService } from "./../email/email.service";
import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GithubRepository } from "@/modules/github/entity/github-repository.entity";
import { GithubService } from "@/modules/github/github.service";
import {
    CheckFrontendRepositoryBuildDto,
    CheckRepositoryBuildDto,
    CheckRepositoryBuildOverviewDto,
    RecheckFrontendBuildDto,
    TriggerFrontendBuilderAgentDto,
    UpdateRepositoryBuildStatusDto,
} from "./dto/repository-build.dto";
import { ProjectTemplateName, ProjectType } from "@/modules/constants/project";
import { FrontendInfraService } from "@/modules/frontend-infra/frontend-infra.service";
import { RepositoryBuild } from "@/modules/repository-build/entity/repository-build.entity";
import { HttpService } from "@nestjs/axios";
import { catchError, concatMap, of, lastValueFrom, retry } from "rxjs";
import { AxiosError } from "axios";
import { AiAgentConfigurationService } from "@/modules/configuration/ai-agent";
import { Iteration } from "../development/entity/iteration.entity";
import { Project } from "../project/entity/project.entity";
import { User } from "../user/entity/user.entity";
import { AppConfigurationService } from "../configuration/app/app.service";
import { GENESOFT_AI_EMAIL } from "../constants/genesoft";

@Injectable()
export class RepositoryBuildService {
    private readonly logger = new Logger(RepositoryBuildService.name);
    private readonly serviceName = RepositoryBuildService.name;

    constructor(
        @InjectRepository(GithubRepository)
        private readonly githubRepositoryRepository: Repository<GithubRepository>,
        @InjectRepository(RepositoryBuild)
        private readonly repositoryBuildRepository: Repository<RepositoryBuild>,
        private readonly githubService: GithubService,
        private readonly frontendInfraService: FrontendInfraService,
        private readonly httpService: HttpService,
        private readonly aiAgentConfigurationService: AiAgentConfigurationService,
        private readonly emailService: EmailService,
        @InjectRepository(Iteration)
        private readonly iterationRepository: Repository<Iteration>,
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly appConfigurationService: AppConfigurationService,
    ) {}

    private async sendBuildFailureEmail(
        iterationId: string,
        type: "frontend" | "backend",
    ) {
        const iteration = await this.iterationRepository.findOne({
            where: { id: iterationId },
        });

        const project = await this.projectRepository.findOne({
            where: { id: iteration.project_id },
        });

        const users = await this.userRepository.find({
            where: { organization_id: project.organization_id },
        });
        const emails = users.map((user) => user.email);

        await this.emailService.sendEmail({
            from: "Genesoft <support@genesoftai.com>",
            topic: `Technical Difficulties for ${project.name} to build your web application`,
            to: [GENESOFT_AI_EMAIL, ...emails],
            subject: `Technical Issues Detected in ${type === "frontend" ? "Web" : "Backend"} Development`,
            html: `
                <p>Hello, ${emails.join(", ")},</p>
                <p>We've encountered some technical difficulties while building your ${type === "frontend" ? "web application" : "backend service"} for iteration ${iterationId}.</p>
                <p>Our team has been notified and is actively working to resolve these issues.</p>
                <p>We will inform you once the issues have been resolved.</p>
                <p>We apologize for any inconvenience caused.</p>

                <p>Details:</p>
                <p>Project: ${project.name}</p>
                <p>Project ID: ${project.id}</p>
                <p>Iteration ID: ${iterationId}</p>

            `,
        });
    }

    private async sendBuildSuccessEmail(
        iterationId: string,
        type: "frontend" | "backend",
    ) {
        const iteration = await this.iterationRepository.findOne({
            where: { id: iterationId },
        });

        const project = await this.projectRepository.findOne({
            where: { id: iteration.project_id },
        });

        const users = await this.userRepository.find({
            where: { organization_id: project.organization_id },
        });
        const emails = users.map((user) => user.email);

        await this.emailService.sendEmail({
            from: "Genesoft <support@genesoftai.com>",
            topic: `Web application development completed for ${project.name}`,
            to: [...emails, GENESOFT_AI_EMAIL],
            subject: `${project.name} web application is ready for review`,
            html: `
                <p>Hello</p>
                <p>Your ${type === "frontend" ? "web application" : "backend service"} development for ${project.name} has been completed successfully.</p>
                <p>Your web application is now ready for your review.</p>
                <p>Please review the changes and provide your feedback.</p>

                <p>Details:</p>
                <p>Project: ${project.name}</p>
                <p>Project ID: ${project.id}</p>
                <p>Iteration ID: ${iterationId}</p>

                <p>Review latest version of your web application at <a href="${this.appConfigurationService.genesoftWebBaseUrl}/dashboard/project/manage/${project.id}">${project.name} on Genesoft AI</a></p>

                <p>Thank you for using Genesoft AI.</p>

                <p>Best regards,</p>
                <p>Genesoft AI Team</p>
            `,
        });
    }

    async checkRepositoryBuild(payload: CheckRepositoryBuildDto) {
        if (payload.template === ProjectTemplateName.NextJsWeb) {
            return this.checkFrontendBuild(payload);
        }

        throw new BadRequestException("Invalid template");
    }

    async checkRepositoryBuildOverview(
        payload: CheckRepositoryBuildOverviewDto,
    ) {
        const iteration = await this.iterationRepository.findOne({
            where: { project_id: payload.project_id },
            order: { created_at: "DESC" },
        });

        if (!iteration) {
            throw new NotFoundException("Iteration not found");
        }

        await this.checkRepositoryBuild({
            project_id: payload.project_id,
            iteration_id: iteration.id,
            template: ProjectTemplateName.NextJsWeb,
        });

        return {
            status: "success",
            message:
                "Repository build overview checked and trigger ai agent if errors",
        };
    }

    async checkFrontendBuild(payload: CheckFrontendRepositoryBuildDto) {
        const { project_id, iteration_id } = payload;
        if (!project_id || !iteration_id) {
            throw new BadRequestException("Invalid payload");
        }

        const project = await this.projectRepository.findOne({
            where: { id: project_id },
        });

        const repositoryBuildExisting =
            await this.repositoryBuildRepository.findOne({
                where: { project_id, iteration_id, type: ProjectType.Web },
            });

        let repositoryBuild;
        if (!repositoryBuildExisting) {
            repositoryBuild = await this.repositoryBuildRepository.save({
                project_id,
                iteration_id,
                type: ProjectType.Web,
                status: "pending",
                error_logs: "",
                fix_attempts: 0,
                fix_triggered: false,
            });
        } else {
            repositoryBuild = repositoryBuildExisting;
        }

        const repository = await this.githubRepositoryRepository.findOne({
            where: { project_id, type: ProjectType.Web },
        });

        const deployment =
            await this.frontendInfraService.getLatestVercelDeployment(
                project_id,
            );

        if (deployment.status === "success") {
            await this.repositoryBuildRepository.update(
                { id: repositoryBuild.id },
                { status: "success" },
            );

            await this.sendBuildSuccessEmail(iteration_id, "frontend");

            return {
                status: "success",
                deployment: repositoryBuild,
            };
        }

        const currentAttempts = repositoryBuild.fix_attempts + 1;
        // await this.triggerFrontendBuilderAgent({
        //     project_id,
        //     iteration_id,
        //     frontend_repo_name: repository.name,
        //     attempts: currentAttempts,
        //     sandbox_id: project.sandbox_id || "",
        // });

        await this.repositoryBuildRepository.update(
            { id: repositoryBuild.id },
            {
                status: "in_progress",
                fix_attempts: currentAttempts,
                fix_triggered: true,
                last_fix_attempt: new Date(),
                error_logs: deployment.errorMessage,
            },
        );

        return {
            status: "in_progress",
            deployment,
        };
    }

    async recheckFrontendBuildWithoutRebuild(payload: RecheckFrontendBuildDto) {
        const { project_id } = payload;

        const repository = await this.githubRepositoryRepository.findOne({
            where: { project_id, type: ProjectType.Web },
        });

        if (!repository) {
            throw new NotFoundException("Repository not found");
        }

        const deployment =
            await this.frontendInfraService.getLatestVercelDeployment(
                project_id,
            );
        const repositoryBuild = await this.repositoryBuildRepository.findOne({
            where: { project_id, type: ProjectType.Web },
            order: { created_at: "DESC" },
        });

        if (deployment.status === "success") {
            if (repositoryBuild) {
                await this.repositoryBuildRepository.update(
                    { id: repositoryBuild.id },
                    { status: "success" },
                );
            }
            if (!repositoryBuild) {
                const latestIteration = await this.iterationRepository.findOne({
                    where: { project_id },
                    order: { created_at: "DESC" },
                });
                await this.repositoryBuildRepository.save({
                    project_id,
                    iteration_id: latestIteration.id,
                    type: ProjectType.Web,
                    status: "success",
                });
            }
            return {
                status: "success",
                deployment,
            };
        } else {
            if (repositoryBuild) {
                await this.repositoryBuildRepository.update(
                    { id: repositoryBuild.id },
                    { status: "failed" },
                );
            }
            if (!repositoryBuild) {
                const latestIteration = await this.iterationRepository.findOne({
                    where: { project_id },
                    order: { created_at: "DESC" },
                });
                await this.repositoryBuildRepository.save({
                    project_id,
                    iteration_id: latestIteration.id,
                    type: ProjectType.Web,
                    status: "failed",
                });
            }
            return {
                status: "failed",
                deployment,
            };
        }
    }

    async triggerFrontendBuilderAgent(payload: TriggerFrontendBuilderAgentDto) {
        const {
            project_id,
            iteration_id,
            frontend_repo_name,
            attempts,
            sandbox_id,
        } = payload;
        const response = await lastValueFrom(
            this.httpService
                .post(
                    `${this.aiAgentConfigurationService.genesoftAiAgentServiceBaseUrl}/api/frontend-builder/fix`,
                    {
                        project_id,
                        iteration_id,
                        frontend_repo_name,
                        attempts,
                        sandbox_id: sandbox_id || "",
                    },
                )
                .pipe(
                    concatMap((res) => of(res.data)),
                    retry(2),
                    catchError((error: AxiosError) => {
                        this.logger.error({
                            message: `${this.serviceName}.triggerFrontendBuilderAgent: Error triggering frontend builder agent`,
                            metadata: { error },
                        });
                        throw error;
                    }),
                ),
        );
        return response;
    }

    async updateRepositoryBuildStatus(payload: UpdateRepositoryBuildStatusDto) {
        await this.repositoryBuildRepository.update(
            { iteration_id: payload.iteration_id },
            { status: payload.status },
        );
        return {
            status: "success",
        };
    }
}
