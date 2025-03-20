import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { AxiosError } from "axios";
import * as firebaseAdmin from "firebase-admin";
import { catchError, concatMap, lastValueFrom, of, retry } from "rxjs";
import { ProjectsClient } from "@google-cloud/resource-manager";
import { ThirdPartyConfigurationService } from "../configuration/third-party/third-party.service";

@Injectable()
export class FirebaseService {
    private readonly firebaseAdmin;
    private readonly firebaseApiBaseUrl = "https://firebase.googleapis.com";
    private readonly cloudResourceManagerApiBaseUrl =
        "https://cloudresourcemanager.googleapis.com";
    private readonly logger = new Logger(FirebaseService.name);
    private readonly serviceName = FirebaseService.name;
    private readonly projectsClient: ProjectsClient;

    constructor(
        private readonly httpService: HttpService,
        private readonly thirdPartyConfigurationService: ThirdPartyConfigurationService,
    ) {
        this.firebaseAdmin = firebaseAdmin;
        this.projectsClient = new ProjectsClient();
    }

    async getGcpProjects() {
        const projects = await this.projectsClient.listProjects({
            parent: `organizations/${this.thirdPartyConfigurationService.gcpOrganizationId}`,
        });
        return projects;
    }

    async createGoogleCloudProject(project_id: string) {
        // const accessToken = await this.getAccessToken();
        const uri = `${this.cloudResourceManagerApiBaseUrl}/v3/projects`;
        const payload = {
            parent: `organizations/${this.thirdPartyConfigurationService.gcpOrganizationId}`,
            displayName: "test project",
            projectId: project_id,
        };

        try {
            // const response = await lastValueFrom(
            //     this.httpService
            //         .post(uri, body, {
            //             headers: {
            //                 Authorization: `Bearer ${this.thirdPartyConfigurationService.gcpApiKey}`,
            //                 "Content-Type": "application/json",
            //             },
            //         })
            //         .pipe(
            //             concatMap((res) => of(res.data)),
            //             retry(2),
            //             catchError((error: AxiosError) => {
            //                 console.error(error);
            //                 throw error;
            //             }),
            //         ),
            // );
            const project = await this.projectsClient.createProject({
                project: payload,
            });

            this.logger.log({
                message: `${this.serviceName}.createGoogleCloudProject: Response`,
                metadata: { project },
            });

            return project;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.createGoogleCloudProject: Error`,
                metadata: { error },
            });
            throw error;
        }
    }

    async getGoogleCloudProject(operation_id: string) {
        const accessToken = await this.getAccessToken();
        const uri = `${this.cloudResourceManagerApiBaseUrl}/v3/operations/${operation_id}`;
        const response = await lastValueFrom(
            this.httpService.get(uri, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            }),
        );

        return response.data;
    }

    async getAccessToken() {
        return this.firebaseAdmin.credential
            .applicationDefault()
            .getAccessToken()
            .then((accessToken) => {
                return accessToken.access_token;
            })
            .catch((err) => {
                console.error("Unable to get access token");
                console.error(err);
            });
    }

    async listProjects() {
        const accessToken = await this.getAccessToken();
        const uri = `${this.firebaseApiBaseUrl}/v1beta1/availableProjects`;
        this.logger.log({
            message: `${this.serviceName}.listProjects: Access token`,
            metadata: { accessToken },
        });
        try {
            const response = await lastValueFrom(
                this.httpService
                    .get(uri, {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    })
                    .pipe(
                        concatMap((res) => of(res.data)),
                        retry(2),
                        catchError((error: AxiosError) => {
                            console.error(error);
                            throw error;
                        }),
                    ),
            );

            this.logger.log({
                message: `${this.serviceName}.listProjects: Response`,
                metadata: { response },
            });
            const projects = response["projectInfo"];
            this.logger.log({
                message: `${this.serviceName}.listProjects: Projects`,
                metadata: { projects },
            });

            return projects;
        } catch (err) {
            this.logger.error({
                message: `${this.serviceName}.listProjects: Error`,
                metadata: { err },
            });
            throw err;
        }
    }
}
