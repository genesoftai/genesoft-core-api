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
    CheckBackendRepositoryBuildDto,
    CheckFrontendRepositoryBuildDto,
    CheckRepositoryBuildDto,
    TriggerBackendBuilderAgentDto,
    TriggerFrontendBuilderAgentDto,
} from "./dto/repository-build.dto";
import { ProjectTemplateName, ProjectType } from "@/modules/constants/project";
import { FrontendInfraService } from "@/frontend-infra/frontend-infra.service";
import { RepositoryBuild } from "@/modules/repository-build/entity/repository-build.entity";
import { HttpService } from "@nestjs/axios";
import { catchError, concatMap, of, lastValueFrom, retry } from "rxjs";
import { AxiosError } from "axios";
import { AiAgentConfigurationService } from "@/modules/configuration/ai-agent";

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
    ) {}

    async checkRepositoryBuild(payload: CheckRepositoryBuildDto) {
        const repository = await this.githubRepositoryRepository.findOne({
            where: { id: payload.project_id },
        });

        if (!repository) {
            throw new NotFoundException("Repository not found");
        }

        if (payload.template === ProjectTemplateName.NextJsWeb) {
            return this.checkFrontendBuild(payload);
        } else if (payload.template === ProjectTemplateName.NestJsApi) {
            return this.checkBackendBuild(payload);
        }

        throw new BadRequestException("Invalid template");
    }
    async checkFrontendBuild(payload: CheckFrontendRepositoryBuildDto) {
        const { project_id, iteration_id } = payload;
        if (!project_id || !iteration_id) {
            throw new BadRequestException("Invalid payload");
        }

        const repositoryBuildExisting =
            await this.repositoryBuildRepository.findOne({
                where: { project_id, iteration_id },
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

        if (deployment.status === "failed") {
            const currentAttempts = repositoryBuild.fix_attempts + 1;
            await this.triggerFrontendBuilderAgent({
                project_id,
                iteration_id,
                frontend_repo_name: repository.name,
                attempts: currentAttempts,
            });

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

        return {
            status: "success",
            deployment,
        };
    }

    async checkBackendBuild(payload: CheckBackendRepositoryBuildDto) {
        const { project_id, iteration_id } = payload;
        if (!project_id || !iteration_id) {
            throw new BadRequestException("Invalid payload");
        }
        const repositoryBuildExisting =
            await this.repositoryBuildRepository.findOne({
                where: { project_id, iteration_id },
            });
        let repositoryBuild;
        if (!repositoryBuildExisting) {
            repositoryBuild = await this.repositoryBuildRepository.save({
                project_id,
                iteration_id,
                type: ProjectType.Api,
                status: "pending",
                error_logs: "",
                fix_attempts: 0,
                fix_triggered: false,
            });
        } else {
            repositoryBuild = repositoryBuildExisting;
        }

        const deployment = await this.githubService.getLatestWorkflowRun({
            project_id,
            branch: "staging",
        });
        if (deployment.status === "failed") {
            const repository = await this.githubRepositoryRepository.findOne({
                where: { project_id, type: ProjectType.Api },
            });
            const currentAttempts = repositoryBuild.fix_attempts + 1;
            await this.triggerBackendBuilderAgent({
                project_id,
                iteration_id,
                backend_repo_name: repository.name,
                attempts: currentAttempts,
            });
            await this.repositoryBuildRepository.update(
                { id: repositoryBuild.id },
                {
                    status: "in_progress",
                    fix_attempts: currentAttempts,
                    fix_triggered: true,
                    last_fix_attempt: new Date(),
                    error_logs: deployment.logs,
                },
            );

            return {
                status: "in_progress",
                deployment,
            };
        }
        return {
            status: "success",
            deployment,
        };
    }

    async triggerBackendBuilderAgent(payload: TriggerBackendBuilderAgentDto) {
        const { project_id, iteration_id, backend_repo_name, attempts } =
            payload;
        const response = await lastValueFrom(
            this.httpService
                .post(
                    `${this.aiAgentConfigurationService.genesoftAiAgentServiceBaseUrl}/api/backend-builder/fix`,
                    {
                        project_id,
                        iteration_id,
                        backend_repo_name,
                        attempts,
                    },
                )
                .pipe(
                    concatMap((res) => of(res.data)),
                    retry(2),
                    catchError((error: AxiosError) => {
                        this.logger.error({
                            message: `${this.serviceName}.triggerBackendBuilderAgent: Error triggering backend builder agent`,
                            metadata: { error },
                        });
                        throw error;
                    }),
                ),
        );
        return response;
    }

    async triggerFrontendBuilderAgent(payload: TriggerFrontendBuilderAgentDto) {
        const { project_id, iteration_id, frontend_repo_name, attempts } =
            payload;
        const response = await lastValueFrom(
            this.httpService
                .post(
                    `${this.aiAgentConfigurationService.genesoftAiAgentServiceBaseUrl}/api/frontend-builder/fix`,
                    {
                        project_id,
                        iteration_id,
                        frontend_repo_name,
                        attempts,
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
}
