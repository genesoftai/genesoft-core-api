import { GithubRepository } from "@modules/github/entity/github-repository.entity";
import { ProjectTemplateName, ProjectType } from "@/modules/constants/project";
import { InjectRepository } from "@nestjs/typeorm";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import {
    CreateNewVercelProjectDto,
    CreateNewVercelProjectRecordDto,
} from "./dto/create-new-vercel-project.dto";
import {
    AddEnvironmentVariablesToVercelProjectDto,
    AddOneEnvironmentVariableToVercelProjectDto,
} from "./dto/update-vercel-project.dto";
import { Repository } from "typeorm";
import { HttpService } from "@nestjs/axios";
import { catchError, concatMap, lastValueFrom, of, retry } from "rxjs";
import { AxiosError } from "axios";
import { VercelConfigurationService } from "@modules/configuration/vercel";
import { VercelProject } from "./entity/vercel-project.entity";
@Injectable()
export class FrontendInfraService {
    private readonly serviceName = "FrontendInfraService";
    private readonly logger = new Logger(FrontendInfraService.name);

    constructor(
        @InjectRepository(GithubRepository)
        private githubRepositoryRepository: Repository<GithubRepository>,
        private readonly httpService: HttpService,
        private readonly vercelConfigurationService: VercelConfigurationService,
        @InjectRepository(VercelProject)
        private vercelProjectRepository: Repository<VercelProject>,
    ) {}

    // Vercel
    async createNewVercelProject(payload: CreateNewVercelProjectDto) {
        const repo_name = `${ProjectTemplateName.NextJsWeb}_${payload.project_id}`;
        const repository = await this.githubRepositoryRepository.findOne({
            where: { name: repo_name, type: ProjectType.Web },
        });
        const repositoryFullName = `genesoftai/${repository.name}`;
        this.logger.log({
            message: `${this.serviceName}.createNewVercelProject: Repository found`,
            metadata: { repository, repositoryFullName, repo_name },
        });
        if (!repository) {
            throw new NotFoundException("Github Repository not found");
        }
        const url = `https://api.vercel.com/v10/projects?teamId=${this.vercelConfigurationService.vercelTeamId}`;
        // const environmentVariables = [
        //     // Production environment variables
        //     {
        //         key: "NEXT_PUBLIC_SUPABASE_URL",
        //         target: ["production"],
        //         gitBranch: "main",
        //         value: "https://test.supabase.com",
        //         type: "plain",
        //     },
        //     {
        //         key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        //         target: ["production"],
        //         gitBranch: "main",
        //         value: "test_anon_key",
        //         type: "plain",
        //     },
        //     {
        //         key: "CORE_API_SERVICE_BASE_URL",
        //         target: ["production"],
        //         gitBranch: "main",
        //         value: "https://test.api.com",
        //         type: "plain",
        //     },
        //     {
        //         key: "CORE_API_SERVICE_API_KEY",
        //         target: ["production"],
        //         gitBranch: "main",
        //         value: "test_api_key",
        //         type: "secret",
        //     },
        //     {
        //         key: "NEXT_PUBLIC_APP_URL",
        //         target: ["production"],
        //         gitBranch: "main",
        //         value: "https://test.app.com",
        //         type: "plain",
        //     },
        //     {
        //         key: "NODE_ENV",
        //         target: ["production"],
        //         gitBranch: "main",
        //         value: "production",
        //         type: "plain",
        //     },

        //     // Staging environment variables
        //     {
        //         key: "NEXT_PUBLIC_SUPABASE_URL",
        //         target: ["preview"],
        //         gitBranch: "staging",
        //         value: "https://test.supabase.com",
        //         type: "plain",
        //     },
        //     {
        //         key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        //         target: ["preview"],
        //         gitBranch: "staging",
        //         value: "test_anon_key",
        //         type: "plain",
        //     },
        //     {
        //         key: "CORE_API_SERVICE_BASE_URL",
        //         target: ["preview"],
        //         gitBranch: "staging",
        //         value: "https://test.api.com",
        //         type: "plain",
        //     },
        //     {
        //         key: "CORE_API_SERVICE_API_KEY",
        //         target: ["preview"],
        //         gitBranch: "staging",
        //         value: "test_api_key",
        //         type: "secret",
        //     },
        //     {
        //         key: "NEXT_PUBLIC_APP_URL",
        //         target: ["preview"],
        //         gitBranch: "staging",
        //         value: "https://test.app.com",
        //         type: "plain",
        //     },
        //     {
        //         key: "NODE_ENV",
        //         target: ["preview"],
        //         gitBranch: "staging",
        //         value: "staging",
        //         type: "plain",
        //     },
        // ];
        const gitRepository = {
            repo: repositoryFullName,
            type: "github",
        };
        const body = {
            name: repo_name,
            // environmentVariables,
            framework: "nextjs",
            gitRepository,
        };
        const headers = {
            Authorization: `Bearer ${this.vercelConfigurationService.vercelAccessToken}`,
        };

        this.logger.log({
            message: `${this.serviceName}.createNewVercelProject: API Request`,
            metadata: { url, body, headers },
        });

        const response = await lastValueFrom(
            this.httpService
                .post(url, body, {
                    headers,
                })
                .pipe(
                    concatMap((res) => of(res.data)),
                    retry(2),
                    catchError((error: AxiosError) => {
                        this.logger.error({
                            message: `${this.serviceName}.createNewVercelProject: Error create Vercel project`,
                            metadata: { error },
                        });
                        throw error;
                    }),
                ),
        );
        const { id } = response;

        await this.vercelProjectRepository.save({
            project_id: payload.project_id,
            vercel_project_id: id,
            vercel_project_name: repo_name,
        });

        this.logger.log({
            message: `${this.serviceName}.createNewVercelProject: Create new Vercel project`,
            metadata: { response },
        });

        return response;
    }

    async createNewVercelProjectRecord(
        payload: CreateNewVercelProjectRecordDto,
    ) {
        const repo_name = `${ProjectTemplateName.NextJsWeb}_${payload.project_id}`;
        const repository = await this.githubRepositoryRepository.findOne({
            where: { name: repo_name, type: ProjectType.Web },
        });
        if (!repository) {
            throw new NotFoundException("Github Repository not found");
        }
        await this.vercelProjectRepository.save({
            project_id: payload.project_id,
            vercel_project_id: payload.vercel_project_id,
            vercel_project_name: payload.vercel_project_name,
        });
    }

    async addEnvironmentVariablesToVercelProject(
        payload: AddEnvironmentVariablesToVercelProjectDto,
    ) {
        const { project_id, environment_variables } = payload;

        const vercelProject = await this.vercelProjectRepository.findOne({
            where: { project_id },
        });

        if (!vercelProject) {
            throw new NotFoundException("Vercel project not found");
        }

        const url = `https://api.vercel.com/v10/projects/${vercelProject.vercel_project_id}/env?teamId=${this.vercelConfigurationService.vercelTeamId}&upsert=true`;
        const headers = {
            Authorization: `Bearer ${this.vercelConfigurationService.vercelAccessToken}`,
        };

        this.logger.log({
            message: `${this.serviceName}.addEnvironmentVariablesToVercelProject: API Request`,
            metadata: { url, environment_variables, headers },
        });

        const response = await lastValueFrom(
            this.httpService.post(url, environment_variables, { headers }).pipe(
                concatMap((res) => of(res.data)),
                retry(2),
                catchError((error: AxiosError) => {
                    this.logger.error({
                        message: `${this.serviceName}.addEnvironmentVariablesToVercelProject: Error adding environment variable`,
                        metadata: { error },
                    });
                    throw error;
                }),
            ),
        );

        this.logger.log({
            message: `${this.serviceName}.addEnvironmentVariablesToVercelProject: Added environment variables`,
            metadata: { response },
        });

        return response;
    }

    async addOneEnvironmentVariableToVercelProject(
        payload: AddOneEnvironmentVariableToVercelProjectDto,
    ) {
        const { project_id, environment_variable } = payload;

        const vercelProject = await this.vercelProjectRepository.findOne({
            where: { project_id },
        });

        if (!vercelProject) {
            throw new NotFoundException("Vercel project not found");
        }

        const url = `https://api.vercel.com/v10/projects/${vercelProject.vercel_project_id}/env?teamId=${this.vercelConfigurationService.vercelTeamId}&upsert=true`;
        const headers = {
            Authorization: `Bearer ${this.vercelConfigurationService.vercelAccessToken}`,
        };

        this.logger.log({
            message: `${this.serviceName}.addOneEnvironmentVariableToVercelProject: API Request`,
            metadata: { url, environment_variable, headers },
        });

        const response = await lastValueFrom(
            this.httpService.post(url, environment_variable, { headers }).pipe(
                concatMap((res) => of(res.data)),
                retry(2),
                catchError((error: AxiosError) => {
                    this.logger.error({
                        message: `${this.serviceName}.addOneEnvironmentVariableToVercelProject: Error adding environment variable`,
                        metadata: { error },
                    });
                    throw error;
                }),
            ),
        );

        this.logger.log({
            message: `${this.serviceName}.addOneEnvironmentVariableToVercelProject: Added environment variable`,
            metadata: { response },
        });

        return response;
    }

    async getLatestDeploymentOfVercelProject(vercel_project_id: string) {
        const url = `https://api.vercel.com/v6/deployments?teamId=${this.vercelConfigurationService.vercelTeamId}&target=preview&projectId=${vercel_project_id}`;
        const headers = {
            Authorization: `Bearer ${this.vercelConfigurationService.vercelAccessToken}`,
        };

        this.logger.log({
            message: `${this.serviceName}.getLatestDeploymentOfVercelProject: API Request`,
            metadata: { url, headers },
        });

        const response = await lastValueFrom(
            this.httpService.get(url, { headers }).pipe(
                concatMap((res) => of(res.data)),
                retry(2),
                catchError((error: AxiosError) => {
                    this.logger.error({
                        message: `${this.serviceName}.getLatestDeploymentOfVercelProject: Error getting latest deployment`,
                        metadata: { error },
                    });
                    throw error;
                }),
            ),
        );

        this.logger.log({
            message: `${this.serviceName}.getLatestDeploymentOfVercelProject: Response`,
            metadata: { response },
        });

        const targetDeployment = response.deployments.find(
            (deployment) => deployment.meta.githubCommitRef === "staging",
        );

        if (!targetDeployment) {
            throw new NotFoundException("Deployment not found");
        }

        return targetDeployment;
    }

    async getDeploymentEvents(deployment_id: string) {
        const url = `https://api.vercel.com/v3/deployments/${deployment_id}/events?teamId=${this.vercelConfigurationService.vercelTeamId}`;
        const headers = {
            Authorization: `Bearer ${this.vercelConfigurationService.vercelAccessToken}`,
        };

        const response = await lastValueFrom(
            this.httpService.get(url, { headers }).pipe(
                concatMap((res) => of(res.data)),
                retry(2),
                catchError((error: AxiosError) => {
                    this.logger.error({
                        message: `${this.serviceName}.getDeploymentEvents: Error getting deployment events`,
                        metadata: { error },
                    });
                    throw error;
                }),
            ),
        );
        return response;
    }

    async getLatestVercelDeployment(project_id: string) {
        const vercelProject = await this.vercelProjectRepository.findOne({
            where: { project_id },
        });
        this.logger.log({
            message: `${this.serviceName}.getLatestVercelDeployment: Vercel project`,
            metadata: { vercelProject },
        });
        const deployment = await this.getLatestDeploymentOfVercelProject(
            vercelProject.vercel_project_id,
        );
        this.logger.log({
            message: `${this.serviceName}.getLatestVercelDeployment: Deployment`,
            metadata: { deployment },
        });
        let errorMessage = "";

        if (deployment.state !== "ERROR") {
            this.logger.log({
                message: `${this.serviceName}.getLatestVercelDeployment: Deployment is not error`,
                metadata: { deployment },
            });
            return { deployment, status: "success", errorMessage };
        }

        const events = await this.getDeploymentEvents(deployment.uid);
        this.logger.log({
            message: `${this.serviceName}.getLatestVercelDeployment: Deployment events`,
            metadata: { events },
        });
        events.forEach((event) => {
            const date = new Date(event.date).toLocaleString();
            const text = event.text;
            const type = event.type;

            errorMessage += `${date} - ${type}, ${event.info.type}: ${text}\n`;
        });
        this.logger.log({
            message: `${this.serviceName}.getLatestVercelDeployment: Deployment events`,
            metadata: { errorMessage },
        });

        return { deployment, status: "failed", errorMessage };
    }
}
