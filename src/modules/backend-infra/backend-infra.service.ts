import { InjectRepository } from "@nestjs/typeorm";
import { catchError, concatMap, lastValueFrom, of, retry } from "rxjs";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { GithubRepository } from "@/modules/github/entity/github-repository.entity";
import { Repository } from "typeorm";
import { ProjectType } from "@/modules/constants/project";
import { v4 as uuidv4 } from "uuid";
import { Supabase } from "@/modules/supabase/entity/supabase.entity";
import { SupabaseService } from "@/modules/supabase/supabase.service";
import { AWSConfigurationService } from "@/modules/configuration/aws";
import { KoyebProject } from "./entity/koyeb-project.entity";
import { KoyebConfigurationService } from "@/modules/configuration/koyeb";
import { AppConfigurationService } from "@/modules/configuration/app";

@Injectable()
export class BackendInfraService {
    private readonly serviceName = BackendInfraService.name;
    private readonly logger = new Logger(this.serviceName);
    private readonly koyebApiUrl = "https://app.koyeb.com";

    constructor(
        private readonly httpService: HttpService,
        @InjectRepository(GithubRepository)
        private readonly githubRepository: Repository<GithubRepository>,
        @InjectRepository(Supabase)
        private readonly supabaseRepository: Repository<Supabase>,
        private readonly supabaseService: SupabaseService,
        private readonly awsConfigurationService: AWSConfigurationService,
        @InjectRepository(KoyebProject)
        private readonly koyebProjectRepository: Repository<KoyebProject>,
        private readonly koyebConfigurationService: KoyebConfigurationService,
        private readonly appConfigurationService: AppConfigurationService,
    ) {}

    async createNewProjectInKoyeb(projectId: string) {
        try {
            const apiKey = `${uuidv4()}${Math.random().toString(36).slice(2)}!@#$%^&*`;
            const app = await this.createNewAppInKoyeb(projectId);
            const service = await this.createNewServiceInKoyeb(
                projectId,
                app.id,
                apiKey,
            );

            const koyebProject = await this.koyebProjectRepository.save({
                project_id: projectId,
                app_id: app?.id,
                service_id: service?.id,
                api_key: apiKey,
            });

            return koyebProject;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.createNewProjectInKoyeb: Error creating new Koyeb project`,
                metadata: { error, projectId },
            });
            throw error;
        }
    }

    async createNewAppInKoyeb(projectId: string) {
        const env =
            this.appConfigurationService.nodeEnv === "production"
                ? "prod"
                : "dev";
        const appName = `${env}-${projectId.split("-")[0]}`;
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
                metadata: { error, projectId },
            });
            throw error;
        }
    }

    async createNewServiceInKoyeb(
        projectId: string,
        appId: string,
        apiKey: string,
    ) {
        try {
            const githubRepository = await this.githubRepository.findOne({
                where: {
                    project_id: projectId,
                    type: ProjectType.Api,
                },
            });

            if (!githubRepository) {
                this.logger.error({
                    message: `${this.serviceName}.createNewServiceInKoyeb: Github repository not found`,
                    metadata: { projectId },
                });
                throw new NotFoundException("Github repository not found");
            }

            const supabase = await this.supabaseRepository.findOne({
                where: {
                    project_id: projectId,
                },
            });

            if (!supabase) {
                this.logger.error({
                    message: `${this.serviceName}.createNewServiceInKoyeb: Supabase not found`,
                    metadata: { projectId },
                });
                throw new NotFoundException("Supabase not found");
            }

            const databaseUrl =
                await this.supabaseService.getSupabaseDBUrl(projectId);
            const anonKey =
                await this.supabaseService.getKeyInfoFromProjectApiKeys(
                    projectId,
                    "anon",
                );
            const serviceRoleKey =
                await this.supabaseService.getKeyInfoFromProjectApiKeys(
                    projectId,
                    "service_role",
                );

            const env = [
                {
                    key: "PROJECT_ID",
                    value: projectId,
                },
                {
                    key: "ENVIRONMENT",
                    value: "production",
                },
                {
                    key: "PORT",
                    value: "8000",
                },
                {
                    key: "API_KEY",
                    value: apiKey,
                },
                {
                    key: "DATABASE_URL",
                    value: databaseUrl,
                },
                {
                    key: "SUPABASE_URL",
                    value: supabase.url,
                },
                {
                    key: "SUPABASE_SERVICE_ROLE_KEY",
                    value: serviceRoleKey.api_key,
                },
                {
                    key: "SUPABASE_ANON_KEY",
                    value: anonKey.api_key,
                },
                {
                    key: "AWS_ACCESS_KEY",
                    value: this.awsConfigurationService.awsAccessKey,
                },
                {
                    key: "AWS_SECRET_KEY",
                    value: this.awsConfigurationService.awsSecretKey,
                },
                {
                    key: "AWS_S3_BUCKET_NAME",
                    value: this.awsConfigurationService.awsS3CustomerBucketName,
                },
                {
                    key: "AWS_REGION",
                    value: this.awsConfigurationService.awsRegion,
                },
                {
                    key: "STRIPE_SECRET_KEY",
                    value: "test_secret_key", // To be filled by user
                },
                {
                    key: "STRIPE_WEBHOOK_SECRET",
                    value: "test_webhook_secret", // To be filled by user
                },
            ];

            const payload = {
                app_id: appId,
                definition: {
                    type: "WEB",
                    name: `api-${projectId}`,
                    git: {
                        repository: `github.com/genesoftai/${githubRepository.name}`,
                        branch: "main",
                    },
                    regions: ["sin"],
                    instance_types: [{ type: "eco-nano" }],
                    scalings: [{ max: 1, min: 1 }],
                    env,
                },
            };

            const response = await lastValueFrom(
                this.httpService
                    .post(`${this.koyebApiUrl}/v1/services`, payload, {
                        headers: {
                            Authorization: `Bearer ${this.koyebConfigurationService.koyebApiKey}`,
                        },
                    })
                    .pipe(
                        concatMap((res) => of(res.data)),
                        retry(2),
                        catchError((error) => {
                            this.logger.error({
                                message: `${this.serviceName}.createNewServiceInKoyeb: Error creating new Koyeb service`,
                                metadata: { error, payload },
                            });
                            throw error;
                        }),
                    ),
            );

            this.logger.log({
                message: `${this.serviceName}.createNewServiceInKoyeb: New Koyeb service created`,
                metadata: { response },
            });

            return response?.service;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.createNewServiceInKoyeb: Error creating new Koyeb service`,
                metadata: { error, projectId, appId },
            });
            throw error;
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

        if (!koyebProject.app_id) {
            this.logger.error({
                message: `${this.serviceName}.getKoyebService: Koyeb service not found`,
                metadata: { projectId },
            });
            throw new NotFoundException("Koyeb service not found");
        }

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

        return response?.service;
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
