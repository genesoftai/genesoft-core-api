import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import { Supabase } from "./entity/supabase.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { HttpService } from "@nestjs/axios";
import { async, catchError, concatMap, lastValueFrom, of, retry } from "rxjs";
import { SupabaseConfigurationService } from "../configuration/supabase";
import { v4 as uuidv4 } from "uuid";
import * as postgres from "postgres";
import { getDbStructureString } from "../../utils/supabase/db";
import { createClient } from "@supabase/supabase-js";
@Injectable()
export class SupabaseService {
    private readonly serviceName = "SupabaseService";
    private readonly logger = new Logger(this.serviceName);
    private readonly supabaseBaseUrl = "https://api.supabase.com";
    private supabaseAdmin;

    constructor(
        private configService: ConfigService,
        private httpService: HttpService,
        @InjectRepository(Supabase)
        private supabaseRepository: Repository<Supabase>,
        private supabaseConfigurationService: SupabaseConfigurationService,
    ) {
        this.supabaseAdmin = createClient(
            "https://" + this.supabaseConfigurationService.supabaseProjectUrl,
            this.supabaseConfigurationService.supabaseServiceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            },
        );
    }

    async createNewSupabaseProject(projectId: string) {
        this.logger.log({
            message: `${this.serviceName}.createNewSupabaseProject: Creating new Supabase project`,
            metadata: { projectId },
        });

        // Generate a more secure password with at least 16 characters including uppercase, lowercase, numbers and special chars
        const db_password = `${uuidv4()}${Math.random().toString(36).slice(2)}`;

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

    async getSupabaseDBUrlForPostgresJs(projectId: string) {
        const supabaseProject = await this.supabaseRepository.findOne({
            where: { project_id: projectId },
        });
        // Ensure all parts of the URL are properly encoded
        const password = encodeURIComponent(supabaseProject.db_password);
        const url = `postgres://postgres:${password}@db.${supabaseProject.supabase_project_id}.supabase.co:5432/postgres`;

        // Add debug logging
        this.logger.debug({
            message: `${this.serviceName}.getSupabaseDBUrlForPostgresJs: Generated URL`,
            metadata: { url },
        });

        return url;
    }

    async getSupabaseDBUrlForTransactionPooler(projectId: string) {
        const supabaseProject = await this.supabaseRepository.findOne({
            where: { project_id: projectId },
        });
        return `postgresql://postgres.${supabaseProject.supabase_project_id}:${supabaseProject.db_password}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;
    }

    async getSupabaseDbConfig(projectId: string) {
        const supabaseProject = await this.supabaseRepository.findOne({
            where: { project_id: projectId },
        });
        return {
            host: "aws-0-ap-southeast-1.pooler.supabase.com",
            port: 6543,
            database: "postgres",
            user: `postgres.${supabaseProject.supabase_project_id}`,
            password: supabaseProject.db_password,
            pool_mode: "transaction",
        };
    }

    async executeSqlQueryWithPostgres(projectId: string, query: string) {
        const supabaseProject = await this.supabaseRepository.findOne({
            where: { project_id: projectId },
        });

        if (!supabaseProject) {
            this.logger.error({
                message: `${this.serviceName}.executeSqlQueryWithPostgres: Supabase project not found`,
                metadata: { projectId },
            });
            throw new Error("Supabase project not found");
        }

        const connectionString =
            await this.getSupabaseDBUrlForPostgresJs(projectId);

        // Add validation logging
        this.logger.debug({
            message: `${this.serviceName}.executeSqlQueryWithPostgres: Connection details`,
            metadata: {
                projectId: supabaseProject.supabase_project_id,
                connectionString,
            },
        });

        try {
            const dbConfig = await this.getSupabaseDbConfig(projectId);
            this.logger.log({
                message: `${this.serviceName}.executeSqlQueryWithPostgres: Database config`,
                metadata: { dbConfig },
            });
            const sql = postgres({
                host: dbConfig.host,
                port: dbConfig.port,
                database: dbConfig.database,
                user: dbConfig.user,
                password: dbConfig.password,
                ssl: {
                    rejectUnauthorized: false,
                },
            });

            this.logger.log({
                message: `${this.serviceName}.executeSqlQueryWithPostgres: Executing query`,
                metadata: { query, connectionString },
            });

            const result = await sql.unsafe(query);
            await sql.end(); // Close the connection after query
            return result;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.executeSqlQueryWithPostgres: Error executing SQL query`,
                metadata: { error, projectId, query },
            });
            throw error;
        }
    }

    // async getDatabaseSchema(projectId: string) {
    //     const schemaQuery = `
    //         SELECT
    //             t.table_name,
    //             c.column_name,
    //             c.data_type,
    //             c.is_nullable,
    //             c.column_default,
    //             tc.constraint_type,
    //             cc.table_name as referenced_table,
    //             cc.column_name as referenced_column
    //         FROM information_schema.tables t
    //         LEFT JOIN information_schema.columns c
    //             ON t.table_name = c.table_name
    //         LEFT JOIN information_schema.key_column_usage kcu
    //             ON c.table_name = kcu.table_name
    //             AND c.column_name = kcu.column_name
    //         LEFT JOIN information_schema.table_constraints tc
    //             ON kcu.constraint_name = tc.constraint_name
    //         LEFT JOIN information_schema.constraint_column_usage cc
    //             ON tc.constraint_name = cc.constraint_name
    //         WHERE t.table_schema = 'public'
    //         ORDER BY t.table_name, c.ordinal_position;
    //     `;

    //     const schema = await this.executeSqlQueryWithPostgres(
    //         projectId,
    //         schemaQuery,
    //     );

    //     this.logger.log({
    //         message: `${this.serviceName}.getDatabaseSchema: Schema`,
    //         metadata: { schema },
    //     });

    //     return getDbStructureString(schema);
    // }

    async getDatabaseStructure(projectId: string) {
        const schemaQuery = `
        WITH public_table_columns AS (SELECT t.table_name,
                                             c.column_name,
                                             c.data_type,
                                             c.is_nullable,
                                             c.column_default,
                                             tc.constraint_type,
                                             cc.table_name  as referenced_table,
                                             cc.column_name as referenced_column
                                      FROM information_schema.tables t
                                               LEFT JOIN information_schema.columns c
                                                         ON t.table_name = c.table_name
                                                             AND t.table_schema = c.table_schema
                                               LEFT JOIN information_schema.key_column_usage kcu
                                                         ON c.table_name = kcu.table_name
                                                             AND c.column_name = kcu.column_name
                                                             AND c.table_schema = kcu.table_schema
                                               LEFT JOIN information_schema.table_constraints tc
                                                         ON kcu.constraint_name = tc.constraint_name
                                                             AND kcu.table_schema = tc.table_schema
                                               LEFT JOIN information_schema.constraint_column_usage cc
                                                         ON tc.constraint_name = cc.constraint_name
                                      WHERE t.table_schema = 'public'
                                      ORDER BY t.table_name, c.ordinal_position),
             auth_table_columns AS (SELECT t.table_name,
                                           c.column_name,
                                           c.data_type,
                                           c.is_nullable,
                                           c.column_default,
                                           tc.constraint_type,
                                           cc.table_name  as referenced_table,
                                           cc.column_name as referenced_column
                                    FROM information_schema.tables t
                                             LEFT JOIN information_schema.columns c
                                                       ON t.table_name = c.table_name
                                             LEFT JOIN information_schema.key_column_usage kcu
                                                       ON c.table_name = kcu.table_name
                                                           AND c.column_name = kcu.column_name
                                             LEFT JOIN information_schema.table_constraints tc
                                                       ON kcu.constraint_name = tc.constraint_name
                                             LEFT JOIN information_schema.constraint_column_usage cc
                                                       ON tc.constraint_name = cc.constraint_name
                                    WHERE t.table_schema = 'auth'
                                      AND t.table_name = 'users'
                                    ORDER BY t.table_name, c.ordinal_position),
             public_table_relations AS (SELECT tc.table_name   as source_table,
                                               kcu.column_name as source_column,
                                               ccu.table_name  AS target_table,
                                               ccu.column_name AS target_column,
                                               tc.constraint_type
                                        FROM information_schema.table_constraints tc
                                                 JOIN information_schema.key_column_usage kcu
                                                      ON tc.constraint_name = kcu.constraint_name
                                                 JOIN information_schema.constraint_column_usage ccu
                                                      ON tc.constraint_name = ccu.constraint_name
                                        WHERE tc.table_schema = 'public'
                                          AND tc.constraint_type = 'FOREIGN KEY'),
             auth_table_relations AS (SELECT tc.table_name   as source_table,
                                             kcu.column_name as source_column,
                                             ccu.table_name  AS target_table,
                                             ccu.column_name AS target_column,
                                             tc.constraint_type
                                      FROM information_schema.table_constraints tc
                                               JOIN information_schema.key_column_usage kcu
                                                    ON tc.constraint_name = kcu.constraint_name
                                               JOIN information_schema.constraint_column_usage ccu
                                                    ON tc.constraint_name = ccu.constraint_name
                                      WHERE tc.table_schema = 'auth'
                                        AND tc.constraint_type = 'FOREIGN KEY'
                                        AND tc.table_name = 'users')
        SELECT json_build_object(
                       'public', json_build_object(
                        'schema', (SELECT json_agg(tc.*) FROM public_table_columns tc),
                        'relations', (SELECT json_agg(tr.*) FROM public_table_relations tr)
                                 ),
                       'auth', json_build_object(
                               'schema', (SELECT json_agg(tc.*) FROM auth_table_columns tc),
                               'relations', (SELECT json_agg(tr.*) FROM auth_table_relations tr)
                               )
               ) as result;
    `;

        const response = await this.executeSqlQueryWithPostgres(
            projectId,
            schemaQuery,
        );

        const result = response[0].result;

        this.logger.log({
            message: `${this.serviceName}.getDatabaseSchema: result`,
            metadata: { result },
        });

        const dbStructureString = getDbStructureString(result);

        return {
            dbStructureString,
            dbStructure: result,
        };
    }

    async getUserByUid(uId: string) {
        const { data, error } =
            await this.supabaseAdmin.auth.admin.getUserById(uId);
        console.log(data, error);
        return data;
    }

    async getGithubUsername(uId): Promise<string | null> {
        this.logger.log({
            message: `${this.serviceName}.getGithubUsername: Getting GitHub username from Supabase`,
        });

        try {
            const { data, error } =
                await this.supabaseAdmin.auth.admin.getUserById(uId);
            console.log(data, error);

            // Check if identities exist and find the GitHub identity
            const githubIdentity = data.user?.identities?.find(
                (identity: any) => identity.provider === "github",
            );

            // Extract username from identity_data if GitHub identity exists
            if (githubIdentity && githubIdentity.identity_data) {
                return githubIdentity.identity_data.user_name || null;
            }
            return null;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.getGithubUsername: Error getting GitHub username`,
                error,
            });
            return null;
        }
    }
}
