import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import { Supabase } from "./entity/supabase.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { HttpService } from "@nestjs/axios";
import { catchError, concatMap, lastValueFrom, of, retry } from "rxjs";
import { SupabaseConfigurationService } from "../configuration/supabase";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class SupabaseService {
    private readonly serviceName = "SupabaseService";
    private readonly logger = new Logger(this.serviceName);
    private readonly supabaseBaseUrl = "https://api.supabase.com";

    constructor(
        private configService: ConfigService,
        private httpService: HttpService,
        @InjectRepository(Supabase)
        private supabaseRepository: Repository<Supabase>,
        private supabaseConfigurationService: SupabaseConfigurationService,
    ) {}

    async createNewSupabaseProject(projectId: string) {
        this.logger.log({
            message: `${this.serviceName}.createNewSupabaseProject: Creating new Supabase project`,
            metadata: { projectId },
        });

        // Generate a more secure password with at least 16 characters including uppercase, lowercase, numbers and special chars
        const db_password = `${uuidv4()}${Math.random().toString(36).slice(2)}!#$%^&*`;

        this.logger.log({
            message: `${this.serviceName}.createNewSupabaseProject: Generated database password`,
            metadata: { db_password },
        });

        const response = await lastValueFrom(
            this.httpService
                .post(
                    `${this.supabaseBaseUrl}/v1/projects`,
                    {
                        name: `${projectId}`,
                        organization_id:
                            this.supabaseConfigurationService
                                .supabaseOrganizationId,
                        db_pass: db_password,
                        region: "ap-southeast-1",
                        desired_instance_size: "micro",
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${this.configService.get("SUPABASE_API_ACCESS_TOKEN")}`,
                        },
                    },
                )
                .pipe(
                    concatMap((res) => of(res.data)),
                    retry(2),
                    catchError((error) => {
                        this.logger.error({
                            message: `${this.serviceName}.createNewSupabaseProject: Error creating new Supabase project`,
                            metadata: { error },
                        });
                        throw error;
                    }),
                ),
        );

        this.logger.log({
            message: `${this.serviceName}.createNewSupabaseProject: Response`,
            metadata: { response },
        });

        const supabaseProjectId = response.id;

        const supabaseEntity = this.supabaseRepository.create({
            project_id: projectId,
            supabase_project_id: supabaseProjectId,
            url: `https://${supabaseProjectId}.supabase.co`,
            db_password: db_password,
        });

        const savedProject = await this.supabaseRepository.save(supabaseEntity);

        return savedProject;
    }

    async getProjectApiKeys(supabaseProjectId: string) {
        const response = await lastValueFrom(
            this.httpService
                .get(
                    `${this.supabaseBaseUrl}/v1/projects/${supabaseProjectId}/api-keys`,
                    {
                        headers: {
                            Authorization: `Bearer ${this.supabaseConfigurationService.supabaseApiAccessToken}`,
                        },
                    },
                )
                .pipe(
                    concatMap((res) => of(res.data)),
                    retry(2),
                    catchError((error) => {
                        this.logger.error({
                            message: `${this.serviceName}.getProjectApiKeys: Error getting project api keys`,
                            metadata: { error },
                        });
                        throw error;
                    }),
                ),
        );

        return response;
    }

    async getKeyInfoFromProjectApiKeys(projectId: string, keyName: string) {
        const supabase = await this.supabaseRepository.findOne({
            where: { project_id: projectId },
        });
        const projectApiKeys = await this.getProjectApiKeys(
            supabase.supabase_project_id,
        );
        const key = projectApiKeys.find((key: any) => key.name === keyName);
        return key;
    }

    async deleteSupabaseProject(projectId: string) {
        this.logger.log({
            message: `${this.serviceName}.deleteSupabaseProject: Deleting project`,
            metadata: { projectId },
        });

        const supabase = await this.supabaseRepository.findOne({
            where: { project_id: projectId },
        });

        if (!supabase) {
            this.logger.error({
                message: `${this.serviceName}.deleteSupabaseProject: Supabase project not found`,
                metadata: { projectId },
            });
            throw new Error("Supabase project not found");
        }

        await lastValueFrom(
            this.httpService
                .delete(
                    `${this.supabaseBaseUrl}/v1/projects/${supabase.supabase_project_id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${this.supabaseConfigurationService.supabaseApiAccessToken}`,
                        },
                    },
                )
                .pipe(
                    concatMap((res) => of(res.data)),
                    retry(2),
                    catchError((error) => {
                        this.logger.error({
                            message: `${this.serviceName}.deleteSupabaseProject: Error deleting project`,
                            metadata: { error },
                        });
                        throw error;
                    }),
                ),
        );

        await this.supabaseRepository.delete({ project_id: projectId });

        return { success: true };
    }
    async getSupabaseProject(projectId: string) {
        this.logger.log({
            message: `${this.serviceName}.getSupabaseProject: Getting project`,
            metadata: { projectId },
        });

        const supabase = await this.supabaseRepository.findOne({
            where: { project_id: projectId },
        });

        if (!supabase) {
            this.logger.error({
                message: `${this.serviceName}.getSupabaseProject: Supabase project not found`,
                metadata: { projectId },
            });
            throw new Error("Supabase project not found");
        }

        return lastValueFrom(
            this.httpService
                .get(
                    `${this.supabaseBaseUrl}/v1/projects/${supabase.supabase_project_id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${this.supabaseConfigurationService.supabaseApiAccessToken}`,
                        },
                    },
                )
                .pipe(
                    concatMap((res) => of(res.data)),
                    retry(2),
                    catchError((error) => {
                        this.logger.error({
                            message: `${this.serviceName}.getSupabaseProject: Error getting project`,
                            metadata: { error },
                        });
                        throw error;
                    }),
                ),
        );
    }

    async getSupabaseDBUrl(projectId: string) {
        const supabaseProject = await this.supabaseRepository.findOne({
            where: { project_id: projectId },
        });
        return `postgresql://postgres:${supabaseProject.db_password}@db.${supabaseProject.supabase_project_id}.supabase.co:5432/postgres`;
    }
}
