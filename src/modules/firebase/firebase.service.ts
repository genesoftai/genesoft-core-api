import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { ProjectsClient } from "@google-cloud/resource-manager";
import { ThirdPartyConfigurationService } from "../configuration/third-party/third-party.service";

@Injectable()
export class FirebaseService {
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
}
