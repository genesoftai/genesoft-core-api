import { InjectRepository } from "@nestjs/typeorm";
import { catchError, concatMap, lastValueFrom, of, retry } from "rxjs";
import {
    Injectable,
    Logger,
    NotFoundException,
    OnModuleInit,
    BadRequestException,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { GithubRepository } from "@/modules/github/entity/github-repository.entity";
import { Repository } from "typeorm";
import { KoyebProject } from "./entity/koyeb-project.entity";
import { KoyebConfigurationService } from "@/modules/configuration/koyeb";
import { AppConfigurationService } from "@/modules/configuration/app";
import { Iteration } from "../development/entity/iteration.entity";
import { Project } from "../project/entity/project.entity";
import { ProjectEnvManagementService } from "@modules/project-env/project-env-management.service";

@Injectable()
export class BackendInfraService implements OnModuleInit {
    private readonly serviceName = BackendInfraService.name;
    private readonly logger = new Logger(this.serviceName);
    private readonly koyebApiUrl = "https://app.koyeb.com";
    private koyebAppId: string = this.koyebConfigurationService.koyebAppId;

    constructor(
        private readonly httpService: HttpService,
        @InjectRepository(GithubRepository)
        private readonly githubRepository: Repository<GithubRepository>,
        private readonly projectEnv: ProjectEnvManagementService,
        @InjectRepository(KoyebProject)
        private readonly koyebProjectRepository: Repository<KoyebProject>,
        private readonly koyebConfigurationService: KoyebConfigurationService,
        private readonly appConfigurationService: AppConfigurationService,
        @InjectRepository(Iteration)
        private readonly iterationRepository: Repository<Iteration>,
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,
    ) {}

    async onModuleInit() {
        // await this.createNewAppInKoyeb();
        // await this.createNewProjectInKoyeb(
        //     "54335ace-d877-46d7-b2a4-9f4ce864e391",
        // );
    }

    /**
     * @deprecated
     * @param projectId
     */
    async getBackendServiceInfo(projectId: string) {
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
        });
        let developmentStatus = "development_done";
        const iteration = await this.iterationRepository.findOne({
            where: { project_id: projectId },
            order: { created_at: "DESC" },
        });

        if (iteration && iteration.status === "in_progress") {
            developmentStatus =
                iteration.type === "page"
                    ? "page_iteration_in_progress"
                    : "feature_iteration_in_progress";
        }
        const developmentDoneAt = iteration?.updated_at
            ? new Date(iteration.updated_at).getTime()
            : null;

        const codesandboxUrl = project?.sandbox_id
            ? `https://codesandbox.io/p/devbox/nextjs-web-${projectId}-${project?.sandbox_id}`
            : null;
        const port = 8000;
        const codesandboxPreviewUrl = `https://${project?.sandbox_id}-${port}.csb.app`;

        return {
            developmentStatus,
            developmentDoneAt,
            codesandboxUrl,
            sandboxId: project?.sandbox_id,
            codesandboxPreviewUrl,
        };
    }

    async createNewProjectInKoyeb(projectId: string) {
        try {
            const serviceName = await this.runNewKoyebInstance(
                this.koyebAppId,
                projectId,
            );
            return await this.koyebProjectRepository.save({
                project_id: projectId,
                app_id: this.koyebAppId,
                service_id: serviceName,
            });
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.createNewProjectInKoyeb: Error creating new Koyeb project`,
                metadata: { error, projectId },
            });
            throw error;
        }
    }

    async createNewAppInKoyeb() {
        const env =
            this.appConfigurationService.nodeEnv === "production"
                ? "prod"
                : "dev";
        const appName = `${env}-client-services`;
        try {
            const response = await lastValueFrom(
                this.httpService
                    .post(
                        `${this.koyebApiUrl}/v1/apps`,
                        {
                            name: appName,
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${this.koyebConfigurationService.koyebApiKey}`,
                            },
                        },
                    )
                    .pipe(
                        concatMap((res) => of(res.data)),
                        retry(2),
                        catchError((error) => {
                            this.logger.error({
                                message: `${this.serviceName}.createNewAppInKoyeb: Error creating new Koyeb app`,
                                metadata: { error },
                            });
                            throw error;
                        }),
                    ),
            );
            this.logger.log({
                message: `${this.serviceName}.createNewAppInKoyeb: New Koyeb app created`,
                metadata: { response },
            });

            return response?.app;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.createNewAppInKoyeb: Error creating new Koyeb app`,
                metadata: { error },
            });
            throw error;
        }
    }

    async reDeployServices(projectId: string) {
        const githubRepository = await this.githubRepository.findOne({
            where: {
                project_id: projectId,
            },
        });
        const koyebProject = await this.koyebProjectRepository.findOne({
            where: {
                project_id: projectId,
            },
        });

        if (!koyebProject) {
            throw new BadRequestException("Koyeb project not found");
        }
        const env = await this.projectEnv.findAll(projectId);
        const serviceName = `api-${projectId}`;
        const payload = {
            definition: {
                type: "WEB",
                name: serviceName,
                git: {
                    repository: `github.com/genesoftai/${githubRepository.name}`,
                    branch: "main",
                },
                regions: ["sin"],
                instance_types: [{ type: "eco-micro" }],
                scalings: [{ max: 1, min: 1 }],
                env: env.map((e) => ({
                    scope: ["service"],
                    key: e.key,
                    value: e.value,
                })),
            },
        };

        try {
            const response = await lastValueFrom(
                this.httpService
                    .put(
                        `${this.koyebApiUrl}/v1/services/${koyebProject.service_id}`,
                        payload,
                        {
                            headers: {
                                Authorization: `Bearer ${this.koyebConfigurationService.koyebApiKey}`,
                            },
                        },
                    )
                    .pipe(
                        concatMap((res) => of(res.data)),
                        catchError((error) => {
                            // this.logger.error({
                            //     message: `${this.serviceName}.createNewServiceInKoyeb: Error creating new Koyeb service`,
                            //     metadata: { error, payload },
                            // });
                            throw error;
                        }),
                    ),
            );

            this.logger.log({
                message: `${this.serviceName}.createNewServiceInKoyeb: New Koyeb service created`,
                metadata: { data: response.data, status: response.status },
            });

            return serviceName;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.createNewServiceInKoyeb: Error creating new Koyeb service`,
                metadata: { data: error.response.data },
            });
        }
    }

    async runNewKoyebInstance(
        appId: string,
        projectId: string,
    ): Promise<string> {
        const githubRepository = await this.githubRepository.findOne({
            where: {
                project_id: projectId,
            },
        });

        const env = await this.projectEnv.findAll(projectId);
        const serviceName = `api-${projectId}`;
        const payload = {
            app_id: appId,
            definition: {
                type: "WEB",
                name: serviceName,
                git: {
                    repository: `github.com/genesoftai/${githubRepository.name}`,
                    branch: "main",
                },
                regions: ["sin"],
                instance_types: [{ type: "eco-micro" }],
                scalings: [{ max: 1, min: 1 }],
                env: env.map((e) => ({
                    scope: ["service"],
                    key: e.key,
                    value: e.value,
                })),
            },
        };

        try {
            const response = await lastValueFrom(
                this.httpService
                    .post(`${this.koyebApiUrl}/v1/services`, payload, {
                        headers: {
                            Authorization: `Bearer ${this.koyebConfigurationService.koyebApiKey}`,
                        },
                    })
                    .pipe(
                        concatMap((res) => of(res.data)),
                        catchError((error) => {
                            // this.logger.error({
                            //     message: `${this.serviceName}.createNewServiceInKoyeb: Error creating new Koyeb service`,
                            //     metadata: { error, payload },
                            // });
                            throw error;
                        }),
                    ),
            );

            this.logger.log({
                message: `${this.serviceName}.createNewServiceInKoyeb: New Koyeb service created`,
                metadata: { data: response.data, status: response.status },
            });

            await this.koyebProjectRepository.save({
                project_id: projectId,
                app_id: appId,
                service_id: response.data.service.id,
            });
            return serviceName;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.createNewServiceInKoyeb: Error creating new Koyeb service`,
                metadata: { data: error.response.data },
            });
        }
    }

    async getKoyebAppByProjectId(projectId: string) {
        const koyebProject = await this.koyebProjectRepository.findOne({
            where: {
                project_id: projectId,
            },
        });

        if (!koyebProject.app_id) {
            this.logger.error({
                message: `${this.serviceName}.getKoyebApp: Koyeb app not found`,
                metadata: { projectId },
            });
            throw new NotFoundException("Koyeb app not found");
        }

        const response = await lastValueFrom(
            this.httpService
                .get(`${this.koyebApiUrl}/v1/apps/${koyebProject.app_id}`, {
                    headers: {
                        Authorization: `Bearer ${this.koyebConfigurationService.koyebApiKey}`,
                    },
                })
                .pipe(
                    concatMap((res) => of(res.data)),
                    retry(2),
                    catchError((error) => {
                        this.logger.error({
                            message: `${this.serviceName}.getKoyebApp: Error getting Koyeb app`,
                            metadata: { error, projectId },
                        });
                        throw error;
                    }),
                ),
        );

        return response?.app;
    }

    async getKoyebServiceByProjectId(projectId: string) {
        const koyebProject = await this.koyebProjectRepository.findOne({
            where: {
                project_id: projectId,
            },
        });

        const response = await lastValueFrom(
            this.httpService
                .get(
                    `${this.koyebApiUrl}/v1/services/${koyebProject.service_id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${this.koyebConfigurationService.koyebApiKey}`,
                        },
                    },
                )
                .pipe(
                    concatMap((res) => of(res.data)),
                    retry(2),
                    catchError((error) => {
                        this.logger.error({
                            message: `${this.serviceName}.getKoyebService: Error getting Koyeb service`,
                            metadata: { error, projectId },
                        });
                        throw error;
                    }),
                ),
        );

        const service = response?.service;
        let deployStatus = "deployed";
        if (
            service.latest_deployment_id != null &&
            service.active_deployment_id != service.latest_deployment_id
        ) {
            deployStatus = "deploying";
        }
        service.deploy_status = deployStatus;
        Logger.log(service);
        return service;
    }

    async deleteKoyebProject(projectId: string) {
        const koyebProject = await this.koyebProjectRepository.findOne({
            where: {
                project_id: projectId,
            },
        });

        if (!koyebProject) {
            this.logger.error({
                message: `${this.serviceName}.deleteKoyebAppByProjectId: Koyeb project not found`,
                metadata: { projectId },
            });
            throw new NotFoundException("Koyeb project not found");
        }

        await this.deleteKoyebService(koyebProject.service_id);
        await this.deleteKoyebApp(koyebProject.app_id);

        await this.koyebProjectRepository.delete(koyebProject.id);

        return {
            status: "success",
        };
    }

    async deleteKoyebApp(appId: string) {
        const response = await lastValueFrom(
            this.httpService.delete(`${this.koyebApiUrl}/v1/apps/${appId}`, {
                headers: {
                    Authorization: `Bearer ${this.koyebConfigurationService.koyebApiKey}`,
                },
            }),
        );

        return response;
    }

    async deleteKoyebService(serviceId: string) {
        const response = await lastValueFrom(
            this.httpService.delete(
                `${this.koyebApiUrl}/v1/services/${serviceId}`,
                {
                    headers: {
                        Authorization: `Bearer ${this.koyebConfigurationService.koyebApiKey}`,
                    },
                },
            ),
        );

        return response;
    }
}
