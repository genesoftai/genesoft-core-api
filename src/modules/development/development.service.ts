import {
    BadRequestException,
    Inject,
    forwardRef,
    Injectable,
    Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, In, Repository } from "typeorm";
import { HttpService } from "@nestjs/axios";
import { catchError, concatMap, lastValueFrom, of, retry } from "rxjs";
import { Iteration } from "./entity/iteration.entity";
import { IterationTask } from "./entity/iteration-task.entity";
import { CreateIterationTasksDto } from "./dto/create-iteration-task.dto";
import { UpdateIterationTaskStatusDto } from "./dto/update-iteration-task.dto";
import {
    IterationStatus,
    IterationTaskStatus,
    IterationType,
} from "@/modules/constants/development";
import { AiAgentId, SystemId } from "@/modules/constants/agent";
import { AiAgentConfigurationService } from "@/modules/configuration/ai-agent/ai-agent.service";
import { ProjectTemplateName, ProjectTemplateType } from "../constants/project";
import { EmailService } from "../email/email.service";
import {
    GENESOFT_AI_EMAIL,
    GENESOFT_BASE_URL,
    GENESOFT_SUPPORT_EMAIL_FROM,
} from "@/modules/constants/genesoft";
import { Project } from "@/modules/project/entity/project.entity";
import { Organization } from "../organization/entity/organization.entity";
import { User } from "../user/entity/user.entity";
import { CreateIterationDto } from "./dto/create-iteration.dto";
import { ProjectService } from "../project/project.service";
import { RepositoryBuildService } from "../repository-build/repository-build.service";
import { GithubService } from "../github/github.service";
import { PageService } from "@/modules/page/page.service";
import { FeatureService } from "@/modules/feature/feature.service";
import { Conversation } from "@/modules/conversation/entity/conversation.entity";
import { OrganizationService } from "../organization/organization.service";
import { Subscription } from "../subscription/entity/subscription.entity";
import { AppConfigurationService } from "@/modules/configuration/app/app.service";
import { Collection } from "../collection/entity/collection.entity";
import { ConversationService } from "@/modules/conversation/conversation.service";
import { IterationStep } from "./entity/iteration-step.entity";
import { GithubBranch } from "../github-management/entity/github-branch.entity";
@Injectable()
export class DevelopmentService {
    private readonly logger = new Logger(DevelopmentService.name);
    private readonly serviceName = "DevelopmentService";
    private readonly freeTierIterationsLimit: number;
    private readonly startupTierIterationsLimit: number;

    constructor(
        @InjectRepository(Iteration)
        private iterationRepository: Repository<Iteration>,
        @InjectRepository(IterationTask)
        private iterationTaskRepository: Repository<IterationTask>,
        @InjectRepository(Conversation)
        private conversationRepository: Repository<Conversation>,
        private readonly httpService: HttpService,
        private readonly aiAgentConfigurationService: AiAgentConfigurationService,
        private readonly emailService: EmailService,
        @InjectRepository(Project)
        private projectRepository: Repository<Project>,
        @InjectRepository(Organization)
        private organizationRepository: Repository<Organization>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @Inject(forwardRef(() => ProjectService))
        private readonly projectService: ProjectService,
        private readonly repositoryBuildService: RepositoryBuildService,
        private readonly githubService: GithubService,
        @Inject(forwardRef(() => PageService))
        private readonly pageService: PageService,
        private readonly featureService: FeatureService,
        private readonly organizationService: OrganizationService,
        @InjectRepository(Subscription)
        private subscriptionRepository: Repository<Subscription>,
        private readonly appConfigurationService: AppConfigurationService,
        @InjectRepository(Collection)
        private collectionRepository: Repository<Collection>,
        private conversationService: ConversationService,
        @InjectRepository(IterationStep)
        private iterationStepRepository: Repository<IterationStep>,
        @InjectRepository(GithubBranch)
        private githubBranchRepository: Repository<GithubBranch>,
    ) {
        this.freeTierIterationsLimit =
            this.appConfigurationService.freeTierIterationsLimit;
        this.startupTierIterationsLimit =
            this.appConfigurationService.startupTierIterationsLimit;
    }

    // Iteration CRUD
    async createIteration(payload: CreateIterationDto): Promise<Iteration> {
        if (payload.type === IterationType.Feedback && !payload.feedback_id) {
            throw new BadRequestException(
                "Feedback ID is required for feedback iteration",
            );
        }
        try {
            const iteration = this.iterationRepository.create(payload);
            const savedIteration =
                await this.iterationRepository.save(iteration);

            // Use a combination of type and template for the switch case
            const iterationType = payload.type;
            const templateType = payload.project_template_type || "";
            const caseKey = `${iterationType}_${templateType}`;
            let branch = "dev";
            if (payload.github_branch_id) {
                const githubBranch = await this.githubBranchRepository.findOne({
                    where: { id: payload.github_branch_id },
                });
                branch = githubBranch.name;
            }

            switch (caseKey) {
                case `${IterationType.Project}_${ProjectTemplateType.Web}`: {
                    this.logger.log({
                        message: `${this.serviceName}.createIteration: Create Project iteration`,
                    });
                    const response = await lastValueFrom(
                        this.httpService.post(
                            `${this.aiAgentConfigurationService.genesoftAiAgentServiceBaseUrl}/api/multi-agents/development/frontend-team-ai-agents/create-project`,
                            {
                                project_id: payload.project_id,
                                input: `Develop the project according to the project documentation about overview and branding. Don't start from scratch but plan tasks based on existing code in the frontend github repository. Please use your creativity based on project documentation to satisfy user requirements.`,
                                iteration_id: savedIteration.id,
                                frontend_repo_name: `${ProjectTemplateName.NextJsWeb}_${payload.project_id}`,
                                branch,
                                sandbox_id: payload.sandbox_id || "",
                            },
                        ),
                    );
                    this.logger.log({
                        message: `${this.serviceName}.createIteration: Project Management AI agent team triggered successfully for update requirements iteration`,
                        metadata: { response: response.data },
                    });
                    break;
                }

                case `${IterationType.CoreDevelopment}_${ProjectTemplateType.Web}`: {
                    this.logger.log({
                        message: `${this.serviceName}.createIteration: Create Core Development iteration`,
                    });
                    const response = await lastValueFrom(
                        this.httpService.post(
                            `${this.aiAgentConfigurationService.genesoftAiAgentServiceBaseUrl}/api/multi-agents/development/frontend-team-ai-agents/conversation`,
                            {
                                project_id: payload.project_id,
                                input: `Develop the project according to the project documentation about overview and branding. Don't start from scratch but plan tasks based on existing code in the frontend github repository. Please use your creativity based on project documentation to satisfy user requirements.`,
                                iteration_id: savedIteration.id,
                                frontend_repo_name: `${ProjectTemplateName.NextJsWeb}_${payload.project_id}`,
                                branch,
                                conversation_id: payload.conversation_id,
                                sandbox_id: payload.sandbox_id || "",
                            },
                        ),
                    );
                    this.logger.log({
                        message: `${this.serviceName}.createIteration: Core Development AI agent team triggered successfully for update requirements iteration`,
                        metadata: { response: response.data },
                    });
                    break;
                }

                case `${IterationType.Project}_${ProjectTemplateType.Backend}`: {
                    this.logger.log({
                        message: `${this.serviceName}.createIteration: Create Project iteration for backend project`,
                    });
                    const response = await lastValueFrom(
                        this.httpService.post(
                            `${this.aiAgentConfigurationService.genesoftAiAgentServiceBaseUrl}/api/multi-agents/development/backend-team-ai-agents/create-project`,
                            {
                                project_id: payload.project_id,
                                input: `Develop the project according to technical requirements from software developer. Don't start from scratch but plan tasks based on existing code in the backend github repository. Please make it satisfy user requirements to be a good backend service for user's web application.`,
                                iteration_id: savedIteration.id,
                                backend_repo_name: `${ProjectTemplateName.NestJsApi}_${payload.project_id}`,
                                branch,
                                conversation_id: payload.conversation_id,
                                sandbox_id: payload.sandbox_id || "",
                                is_create_web_project:
                                    payload.is_create_web_project,
                                collection_id: payload.collection_id,
                            },
                        ),
                    );
                    this.logger.log({
                        message: `${this.serviceName}.createIteration: Core Development AI agent team triggered successfully for update requirements iteration`,
                        metadata: { response: response.data },
                    });
                    break;
                }

                case `${IterationType.CoreDevelopment}_${ProjectTemplateType.Backend}`: {
                    this.logger.log({
                        message: `${this.serviceName}.createIteration: Create Core Development iteration for backend project`,
                    });
                    const response = await lastValueFrom(
                        this.httpService.post(
                            `${this.aiAgentConfigurationService.genesoftAiAgentServiceBaseUrl}/api/multi-agents/development/backend-team-ai-agents/conversation`,
                            {
                                project_id: payload.project_id,
                                input: `Develop the project according to technical requirements from software developer. Don't start from scratch but plan tasks based on existing code in the backend github repository. Please make it satisfy user requirements to be a good backend service for user's web application.`,
                                iteration_id: savedIteration.id,
                                backend_repo_name: `${ProjectTemplateName.NestJsApi}_${payload.project_id}`,
                                branch,
                                conversation_id: payload.conversation_id,
                                sandbox_id: payload.sandbox_id || "",
                            },
                        ),
                    );
                    this.logger.log({
                        message: `${this.serviceName}.createIteration: Core Development AI agent team triggered successfully for update requirements iteration`,
                        metadata: { response: response.data },
                    });
                    break;
                }

                default: {
                    // No specific action needed for other iteration types
                    this.logger.log({
                        message: `${this.serviceName}.createIteration: No specific action for iteration type ${iterationType} with template ${templateType}`,
                    });
                }
            }

            return savedIteration;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.createIteration: Failed to create iteration`,
                metadata: { data: payload, error: error.message },
            });
            throw error;
        }
    }

    async createProjectIterationsForCollection(
        collectionId: string,
        requirements: string,
    ) {
        this.logger.log({
            message: `${this.serviceName}.createProjectIterationsForCollection: Create project iterations for collection`,
            metadata: { collectionId, requirements },
        });
        try {
            const collection = await this.collectionRepository.findOne({
                where: { id: collectionId },
            });
            if (!collection) {
                throw new BadRequestException("Collection not found");
            }
            const webProject = await this.projectRepository.findOne({
                where: { id: collection.web_project_id },
            });
            if (!webProject) {
                throw new BadRequestException("Web project not found");
            }
            const backendProject = await this.projectRepository.findOne({
                where: { id: collection.backend_service_project_ids[0] },
            });
            if (!backendProject) {
                throw new BadRequestException("Backend project not found");
            }

            const webIteration = await this.iterationRepository.save({
                project_id: webProject.id,
                type: IterationType.Project,
            });

            await lastValueFrom(
                this.httpService.post(
                    `${this.aiAgentConfigurationService.genesoftAiAgentServiceBaseUrl}/api/multi-agents/development/frontend-team-ai-agents/create-project`,
                    {
                        project_id: webProject.id,
                        input: `Develop the project according to the project documentation about overview and branding. Don't start from scratch but plan tasks based on existing code in the frontend github repository. Please use your creativity based on project documentation to satisfy user requirements.`,
                        iteration_id: webIteration.id,
                        frontend_repo_name: `${ProjectTemplateName.NextJsWeb}_${webProject.id}`,
                        branch: "dev",
                        sandbox_id: webProject.sandbox_id || "",
                        requirements,
                    },
                ),
            );

            const webConversation = await this.conversationRepository.save({
                project_id: webProject.id,
                name: "Web Project Creation",
                description: "Conversation about the web project creation",
                user_id: SystemId.PageChannelSystemId,
                status: "active",
                iteration_id: webIteration.id,
            });

            await this.conversationService.talkToProjectManager({
                project_id: webProject.id,
                conversation_id: webConversation.id,
                message: {
                    content: `Please update user with latest information about the project creation of ${webProject.name}`,
                    sender_type: "system",
                    message_type: "text",
                    sender_id: SystemId.GenesoftProjectManager,
                },
            });

            const backendIteration = await this.iterationRepository.save({
                project_id: backendProject.id,
                type: IterationType.Project,
            });

            await lastValueFrom(
                this.httpService.post(
                    `${this.aiAgentConfigurationService.genesoftAiAgentServiceBaseUrl}/api/multi-agents/development/backend-team-ai-agents/create-project`,
                    {
                        project_id: backendProject.id,
                        input: `Develop the project according to technical requirements from software developer. Don't start from scratch but plan tasks based on existing code in the backend github repository. Please make it satisfy user requirements to be a good backend service for user's web application.`,
                        iteration_id: backendIteration.id,
                        backend_repo_name: `${ProjectTemplateName.NestJsApi}_${backendProject.id}`,
                        branch: "dev",
                        sandbox_id: backendProject.sandbox_id || "",
                        requirements,
                    },
                ),
            );

            const backendConversation = await this.conversationRepository.save({
                project_id: backendProject.id,
                name: "Backend Project Creation",
                description: "Conversation about the backend project creation",
                user_id: SystemId.GenesoftProjectManager,
                status: "active",
                iteration_id: backendIteration.id,
            });

            await this.conversationService.talkToBackendDeveloper({
                project_id: backendProject.id,
                conversation_id: backendConversation.id,
                message: {
                    content: `Please update user with latest information about the backend project creation of ${backendProject.name}`,
                    sender_type: "system",
                    message_type: "text",
                    sender_id: AiAgentId.GenesoftBackendDeveloper,
                },
            });

            return {
                webIteration,
                backendIteration,
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.createProjectIterationsForCollection: Failed to create project iterations for collection`,
                metadata: { collectionId, error: error.message },
            });
            throw error;
        }
    }

    async triggerTechnicalProjectManagerAiAgentToCreateRequirements(
        collectionId: string,
        webDescription: string,
        backendRequirements: string,
    ) {
        this.logger.log({
            message: `${this.serviceName}.triggerTechnicalProjectManagerAiAgentToCreateRequirements: Trigger technical project manager ai agent to create requirements`,
            metadata: { collectionId, webDescription, backendRequirements },
        });
        const response = await lastValueFrom(
            this.httpService
                .post(
                    `${this.aiAgentConfigurationService.genesoftAiAgentServiceBaseUrl}/api/project-management/development/project/technical-requirements`,
                    {
                        collection_id: collectionId,
                        web_description: webDescription,
                        backend_requirements: backendRequirements,
                    },
                )
                .pipe(
                    concatMap((res) => of(res.data)),
                    retry(2),
                    catchError((error) => {
                        this.logger.error({
                            message: `${this.serviceName}.triggerTechnicalProjectManagerAiAgentToCreateRequirements: Failed to trigger technical project manager ai agent to create requirements`,
                            metadata: { error: error.message },
                        });
                        throw error;
                    }),
                ),
        );
        return response.data;
    }

    async getIterations(): Promise<Iteration[]> {
        try {
            return this.iterationRepository.find();
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.getIterations: Failed to get iterations`,
                metadata: { error: error.message },
            });
            throw error;
        }
    }

    async getIterationById(id: string): Promise<any> {
        try {
            const iterationTasks = await this.iterationTaskRepository.find({
                where: { iteration_id: id },
            });

            const iteration = await this.iterationRepository.findOne({
                where: { id },
            });

            return { ...iteration, iteration_tasks: iterationTasks };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.getIterationById: Failed to get iteration`,
                metadata: { id, error: error.message },
            });
            throw error;
        }
    }

    async getIterationsByProjectId(
        projectId: string,
        order: "ASC" | "DESC" = "DESC",
    ): Promise<Iteration[]> {
        try {
            return this.iterationRepository.find({
                where: { project_id: projectId },
                order: { created_at: order },
            });
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.getIterationByProjectId: Failed to get iterations of project`,
                metadata: { projectId, error },
            });
            throw error;
        }
    }

    async getLatestIterationByProjectId(projectId: string): Promise<object> {
        try {
            const iteration = await this.iterationRepository.findOne({
                where: { project_id: projectId },
                order: { created_at: "DESC" },
            });
            const conversation = await this.conversationRepository.findOne({
                where: { iteration_id: iteration.id },
            });
            let page, feature;
            if (iteration.type === IterationType.FeatureDevelopment) {
                feature = await this.featureService.getFeature(
                    conversation.feature_id,
                );
            } else if (iteration.type === IterationType.PageDevelopment) {
                page = await this.pageService.getPage(conversation.page_id);
            }
            const iterationTasks = await this.iterationTaskRepository.find({
                where: { iteration_id: iteration.id },
                order: { created_at: "ASC" },
            });
            return {
                ...iteration,
                conversation,
                feature,
                page,
                iteration_tasks: iterationTasks,
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.getLatestIterationByProjectId: Failed to get latest iteration by project id`,
                metadata: { projectId, error: error.message },
            });
            throw error;
        }
    }

    async updateIteration(
        id: string,
        data: Partial<Iteration>,
    ): Promise<Iteration> {
        try {
            await this.iterationRepository.update(id, data);
            return this.getIterationById(id);
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.updateIteration: Failed to update iteration`,
                metadata: { id, data, error: error.message },
            });
            throw error;
        }
    }

    async updateIterationStatus(
        id: string,
        status: IterationStatus,
    ): Promise<Iteration> {
        try {
            await this.iterationRepository.update(id, { status });
            const updatedIteration = await this.iterationRepository.findOne({
                where: { id },
            });
            const conversation = await this.conversationRepository.findOne({
                where: {
                    iteration_id: id,
                },
            });

            const project = await this.projectService.getProjectById(
                updatedIteration.project_id,
            );

            const organization = await this.organizationRepository.findOne({
                where: {
                    id: project.organization_id,
                },
            });
            const users =
                await this.organizationService.getUsersForOrganization(
                    organization.id,
                );

            const userEmails = users.map((user) => user?.email);

            if (
                status === IterationStatus.Done &&
                updatedIteration.type === IterationType.CoreDevelopment &&
                project.project_template_type ===
                    `${ProjectTemplateType.Web}_nextjs`
            ) {
                await this.emailService.sendEmail({
                    to: [...userEmails, GENESOFT_AI_EMAIL],
                    subject: `Web application development completed for ${conversation.name} conversation`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <img src="https://genesoftai.com/assets/genesoft-logo-blue.png" alt="Genesoft Logo" style="max-width: 150px;">
                            </div>
                            <h2 style="color: #4a86e8; margin-bottom: 20px;">Good News! Your Web Application Development is Completed!</h2>
                            <p style="font-size: 16px; line-height: 1.5; color: #333;">
                                We're pleased to inform you that the latest generation for your web application has been successfully completed.
                            </p>
                            <div style="background-color: #f5f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p style="margin: 0; font-size: 15px;">
                                    <strong>Project:</strong> ${project.name || "No project name provided"}<br>
                                    <strong>Conversation:</strong> ${conversation.name || "No name provided"}<br>
                                </p>
                            </div>
                            <p style="font-size: 16px; line-height: 1.5; color: #333;">
                                You can now review the completed work in your AI Agent page of Genesoft.
                            </p>
                            <div style="text-align: center; margin: 25px 0;">
                                <a href="${GENESOFT_BASE_URL}/dashboard/project/${updatedIteration.project_id}/ai-agent" style="background-color: #4a86e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View latest version of your web application</a>
                            </div>
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 14px; color: #777;">
                                <p>If you have any questions, please contact our support team at <a href="mailto:support@genesoftai.com" style="color: #4a86e8;">support@genesoftai.com</a>.</p>
                            </div>
                        </div>
                    `,
                    from: GENESOFT_SUPPORT_EMAIL_FROM,
                });
                await this.repositoryBuildService.checkRepositoryBuildOverview({
                    project_id: updatedIteration.project_id,
                });
            } else if (
                status === IterationStatus.Done &&
                updatedIteration.type === IterationType.Project &&
                project.project_template_type ===
                    `${ProjectTemplateType.Web}_nextjs`
            ) {
                await this.emailService.sendEmail({
                    to: [...userEmails, GENESOFT_AI_EMAIL],
                    subject: `Project initialization completed successfully for ${project?.name}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <img src="https://genesoftai.com/assets/genesoft-logo-blue.png" alt="Genesoft Logo" style="max-width: 150px;">
                            </div>
                            <h2 style="color: #4a86e8; margin-bottom: 20px;">Good News! Your Project Has Been Successfully Initialized</h2>
                            <p style="font-size: 16px; line-height: 1.5; color: #333;">
                                We're pleased to inform you that your project has been successfully initialized and is ready for use.
                            </p>
                            <div style="background-color: #f5f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p style="margin: 0; font-size: 15px;">
                                    <strong>Project:</strong> ${project?.name || "No project name provided"}<br>
                                    <strong>Description:</strong> ${project?.description || "No description provided"}
                                </p>
                            </div>
                            <p style="font-size: 16px; line-height: 1.5; color: #333;">
                                You can now access your project dashboard to start working with your newly initialized project.
                            </p>
                            <div style="text-align: center; margin: 25px 0;">
                                <a href="${GENESOFT_BASE_URL}/dashboard/project/manage/${updatedIteration.project_id}" style="background-color: #4a86e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View</a>
                            </div>
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 14px; color: #777;">
                                <p>If you have any questions, please contact our support team at <a href="mailto:support@genesoftai.com" style="color: #4a86e8;">support@genesoftai.com</a>.</p>
                            </div>
                            <p style="font-size: 16px; line-height: 1.5; color: #333; background-color: #fffde7; padding: 15px; border-left: 4px solid #ffd600; margin: 20px 0; border-radius: 4px;">
                                <strong>Important:</strong> Your project is now being enhanced with powerful infrastructure! The Genesoft team is currently setting up critical components (backend services, authentication systems, deployment pipelines, etc.) to make your project fully functional. We're working diligently to complete this process and will notify you immediately when your project infrastructure is ready for use. This final step will unlock the full potential of your application!
                            </p>
                        </div>
                    `,
                    from: GENESOFT_SUPPORT_EMAIL_FROM,
                });
                await this.repositoryBuildService.checkRepositoryBuildOverview({
                    project_id: updatedIteration.project_id,
                });
            } else if (
                status === IterationStatus.Done &&
                updatedIteration.type === IterationType.CoreDevelopment &&
                project.project_template_type ===
                    `${ProjectTemplateType.Backend}_nestjs`
            ) {
                await this.emailService.sendEmail({
                    to: [...userEmails, GENESOFT_AI_EMAIL],
                    subject: `Backend service development completed successfully for ${project?.name}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <img src="https://genesoftai.com/assets/genesoft-logo-blue.png" alt="Genesoft Logo" style="max-width: 150px;">
                            </div>
                            <h2 style="color: #4a86e8; margin-bottom: 20px;">Good News! Your Backend Service Has Been Successfully Developed</h2>
                            <p style="font-size: 16px; line-height: 1.5; color: #333;">
                                We're pleased to inform you that the core development of your backend service has been successfully completed and is ready for use.
                            </p>
                            <div style="background-color: #f5f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p style="margin: 0; font-size: 15px;">
                                    <strong>Project:</strong> ${project?.name || "No project name provided"}<br>
                                    <strong>Backend Requirements:</strong> ${project?.backend_requirements || "No backend requirements provided"}
                                </p>
                            </div>
                            <p style="font-size: 16px; line-height: 1.5; color: #333;">
                                You can now access your project dashboard to review your backend service and its API endpoints.
                            </p>
                            <div style="text-align: center; margin: 25px 0;">
                                <a href="${GENESOFT_BASE_URL}/dashboard/project/manage/${updatedIteration.project_id}" style="background-color: #4a86e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View</a>
                            </div>
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 14px; color: #777;">
                                <p>If you have any questions, please contact our support team at <a href="mailto:support@genesoftai.com" style="color: #4a86e8;">support@genesoftai.com</a>.</p>
                            </div>
                            <p style="font-size: 16px; line-height: 1.5; color: #333; background-color: #fffde7; padding: 15px; border-left: 4px solid #ffd600; margin: 20px 0; border-radius: 4px;">
                                <strong>Important:</strong> Your backend service is now ready for integration! The API endpoints have been developed according to your specifications. You can now connect your frontend applications to these endpoints or use them with API testing tools. If you need any assistance with integration or have questions about the API functionality, our support team is ready to help.
                            </p>
                        </div>
                    `,
                    from: GENESOFT_SUPPORT_EMAIL_FROM,
                });
            } else if (
                status === IterationStatus.Done &&
                updatedIteration.type === IterationType.Project &&
                project.project_template_type ===
                    `${ProjectTemplateType.Backend}_nestjs`
            ) {
                await this.emailService.sendEmail({
                    to: [...userEmails, GENESOFT_AI_EMAIL],
                    subject: `Backend service project initialization completed successfully for ${project?.name}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <img src="https://genesoftai.com/assets/genesoft-logo-blue.png" alt="Genesoft Logo" style="max-width: 150px;">
                            </div>
                            <h2 style="color: #4a86e8; margin-bottom: 20px;">Good News! Your Backend Service Project Has Been Successfully Initialized</h2>
                            <p style="font-size: 16px; line-height: 1.5; color: #333;">
                                We're pleased to inform you that your backend service project has been successfully initialized and is ready for development.
                            </p>
                            <div style="background-color: #f5f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p style="margin: 0; font-size: 15px;">
                                    <strong>Project:</strong> ${project?.name || "No project name provided"}<br>
                                    <strong>Backend Requirements:</strong> ${project?.backend_requirements || "No backend requirements provided"}
                                </p>
                            </div>
                            <p style="font-size: 16px; line-height: 1.5; color: #333;">
                                You can now access your project dashboard to monitor the development progress of your backend service.
                            </p>
                            <div style="text-align: center; margin: 25px 0;">
                                <a href="${GENESOFT_BASE_URL}/dashboard/project/manage/${updatedIteration.project_id}" style="background-color: #4a86e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View</a>
                            </div>
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 14px; color: #777;">
                                <p>If you have any questions, please contact our support team at <a href="mailto:support@genesoftai.com" style="color: #4a86e8;">support@genesoftai.com</a>.</p>
                            </div>
                            <p style="font-size: 16px; line-height: 1.5; color: #333; background-color: #fffde7; padding: 15px; border-left: 4px solid #ffd600; margin: 20px 0; border-radius: 4px;">
                                <strong>Important:</strong> Your backend service project is now being set up! Our system is currently configuring the API architecture, database models, and authentication systems based on your specifications. The core development phase will begin shortly, during which we'll implement all the requested endpoints and business logic. You'll receive another notification when your backend service is fully developed and ready for integration with your frontend applications.
                            </p>
                        </div>
                    `,
                    from: GENESOFT_SUPPORT_EMAIL_FROM,
                });
            }
            return updatedIteration;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.updateIterationStatus: Failed to update iteration status`,
                metadata: { id, status, error: error.message },
            });
            throw error;
        }
    }

    async createWebIterationByCollectionId(
        collectionId: string,
    ): Promise<Iteration> {
        try {
            const collection = await this.collectionRepository.findOne({
                where: { id: collectionId },
            });
            if (!collection) {
                throw new Error("Collection not found");
            }
            const project = await this.projectRepository.findOne({
                where: { id: collection.web_project_id },
            });
            if (!project) {
                throw new Error("Project not found");
            }
            const iteration = await this.createIteration({
                type: IterationType.Project,
                project_template_type: ProjectTemplateType.Web,
                project_id: project.id,
                sandbox_id: project.sandbox_id,
            });

            return iteration;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.createWebIterationByCollectionId: Failed to create web iteration by collection id`,
                metadata: { collectionId, error: error.message },
            });
            throw error;
        }
    }

    async deleteIteration(id: string): Promise<void> {
        try {
            await this.iterationRepository.delete(id);
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.deleteIteration: Failed to delete iteration`,
                metadata: { id, error: error.message },
            });
            throw error;
        }
    }

    async getIterationPastSteps(
        iterationId: string,
        team: string,
    ): Promise<object> {
        try {
            const iterationTasks = await this.iterationTaskRepository.find({
                where: {
                    iteration_id: iterationId,
                    status: IterationTaskStatus.Done,
                    team: team,
                },
            });

            this.logger.log({
                message: `${this.serviceName}.getIterationPastSteps: Iteration tasks`,
                metadata: { iterationTasks },
            });
            const pastStepsInTasks = {};
            iterationTasks.forEach((task) => {
                this.logger.log({
                    message: `${this.serviceName}.getIterationPastSteps: Task result`,
                    metadata: { taskResult: task },
                });

                if (task?.result?.past_steps) {
                    const subtasks = task?.result?.past_steps.map(
                        (step) => step,
                    );
                    pastStepsInTasks[task?.name] = subtasks;
                }
            });
            return pastStepsInTasks;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.getIterationPastSteps: Failed to get iteration past steps`,
                metadata: { iterationId, error: error.message },
            });
            throw error;
        }
    }

    // Iteration Task CRUD
    async createIterationTask(
        data: Partial<IterationTask>,
    ): Promise<IterationTask> {
        try {
            this.logger.log({
                message: `${this.serviceName}.createIterationTask: Iteration task`,
                metadata: { data },
            });
            const iterationTask = this.iterationTaskRepository.create(data);
            return await this.iterationTaskRepository.save(iterationTask);
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.createIterationTask: Failed to create iteration task`,
                metadata: { data, error: error.message },
            });
            throw error;
        }
    }

    async createIterationTasks(
        iterationId: string,
        payload: CreateIterationTasksDto,
    ): Promise<IterationTask[]> {
        try {
            for (const taskData of payload.tasks) {
                const task = this.iterationTaskRepository.create({
                    ...taskData,
                    iteration_id: iterationId,
                });
                await this.iterationTaskRepository.save(task);
            }

            const tasks = await this.iterationTaskRepository.find({
                where: {
                    iteration_id: iterationId,
                    status: IterationTaskStatus.Todo,
                },
                order: { created_at: "ASC" },
            });

            return tasks;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.createIterationTasks: Failed to create iteration tasks`,
                metadata: { payload, iterationId, error: error.message },
            });
            throw error;
        }
    }

    async getIterationTasks(): Promise<IterationTask[]> {
        try {
            return this.iterationTaskRepository.find({
                relations: ["iteration"],
            });
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.getIterationTasks: Failed to get iteration tasks`,
                metadata: { error: error.message },
            });
            throw error;
        }
    }

    async getIterationTaskById(id: string): Promise<IterationTask> {
        try {
            return this.iterationTaskRepository.findOneOrFail({
                where: { id },
                relations: ["iteration"],
            });
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.getIterationTaskById: Failed to get iteration task`,
                metadata: { id, error: error.message },
            });
            throw error;
        }
    }

    async updateIterationTask(
        id: string,
        data: Partial<IterationTask>,
    ): Promise<IterationTask> {
        try {
            await this.iterationTaskRepository.update(id, data);
            return this.getIterationTaskById(id);
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.updateIterationTask: Failed to update iteration task`,
                metadata: { id, data, error: error.message },
            });
            throw error;
        }
    }

    async deleteIterationTask(id: string): Promise<void> {
        try {
            await this.iterationTaskRepository.delete(id);
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.deleteIterationTask: Failed to delete iteration task`,
                metadata: { id, error: error.message },
            });
            throw error;
        }
    }

    // Iteration Step CRUD
    async createIterationStep(
        data: Partial<IterationStep>,
    ): Promise<IterationStep> {
        try {
            return this.iterationStepRepository.save(data);
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.createIterationStep: Failed to create iteration step`,
                metadata: { data, error: error.message },
            });
            throw error;
        }
    }

    async getIterationStepsByTaskId(taskId: string): Promise<IterationStep[]> {
        try {
            return this.iterationStepRepository.find({
                where: { iteration_task_id: taskId },
                relations: ["iteration_task"],
            });
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.getIterationStepsByTaskId: Failed to get iteration steps by task id`,
                metadata: { taskId, error: error.message },
            });
            throw error;
        }
    }

    async getIterationStepById(id: string): Promise<IterationStep> {
        try {
            return this.iterationStepRepository.findOneOrFail({
                where: { id },
                relations: ["iteration_task"],
            });
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.getIterationStepById: Failed to get iteration step`,
                metadata: { id, error: error.message },
            });
            throw error;
        }
    }

    async updateIterationStep(
        id: string,
        data: Partial<IterationStep>,
    ): Promise<IterationStep> {
        try {
            await this.iterationStepRepository.update(id, data);
            return this.getIterationStepById(id);
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.updateIterationStep: Failed to update iteration step`,
                metadata: { id, data, error: error.message },
            });
            throw error;
        }
    }

    async deleteIterationStep(id: string): Promise<void> {
        try {
            await this.iterationStepRepository.delete(id);
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.deleteIterationStep: Failed to delete iteration step`,
                metadata: { id, error: error.message },
            });
            throw error;
        }
    }

    // Additional Methods

    async getIterationTasksByIterationId(
        iterationId: string,
    ): Promise<IterationTask[]> {
        try {
            return this.iterationTaskRepository.find({
                where: { iteration_id: iterationId },
                relations: ["iteration"],
            });
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.getIterationTasksByIterationId: Failed to get iteration tasks`,
                metadata: { iterationId, error: error.message },
            });
            throw error;
        }
    }

    async bulkUpdateIterationTaskStatus(
        iterationId: string,
        status: string,
    ): Promise<void> {
        try {
            await this.iterationTaskRepository.update(
                { iteration_id: iterationId },
                { status },
            );
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.bulkUpdateIterationTaskStatus: Failed to update iteration tasks status`,
                metadata: { iterationId, status, error: error.message },
            });
            throw error;
        }
    }

    async updateIterationTaskStatus(
        id: string,
        payload: UpdateIterationTaskStatusDto,
    ): Promise<IterationTask> {
        try {
            const iterationTask = await this.getIterationTaskById(id);
            const iteration = await this.getIterationById(
                iterationTask.iteration_id,
            );
            this.logger.log({
                message: `${this.serviceName}.updateIterationTaskStatus: Iteration`,
                metadata: { iteration },
            });
            const project = await this.projectRepository.findOne({
                where: { id: iteration.project_id },
            });
            const organization = await this.organizationRepository.findOne({
                where: { id: project.organization_id },
            });
            const users = await this.userRepository.find({
                where: { organization_id: organization.id },
            });
            const result = await this.updateIterationTask(id, {
                status: payload.status,
            });
            try {
                const usersEmails = users.map((user) => user.email);

                let statusText = "In Progress";
                if (payload.status === "done") {
                    statusText = "Completed";
                } else if (payload.status === "failed") {
                    statusText = "Failed";
                }

                const emailSent = await this.emailService.sendEmail({
                    from: "Genesoft <support@genesoftai.com>",
                    to: [...usersEmails, GENESOFT_AI_EMAIL],
                    subject: `${project.name}: Task ${statusText} for ${iteration.type} Sprint`,
                    html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2>Project: ${project.name}</h2>
                        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                        <h3>Sprint Details</h3>
                        <p><strong>Sprint ID:</strong> ${iteration.id}</p>
                        <p><strong>Sprint Type:</strong> ${iteration.type}</p>
                        <p><strong>Sprint Status:</strong> ${iteration.status}</p>
                        <h3>Task Details</h3>
                        <p><strong>Task Name:</strong> ${iterationTask.name}</p>
                        <p><strong>Description:</strong> ${iterationTask.description}</p>
                        <p><strong>Team:</strong> ${iterationTask.team}</p>
                        <p><strong>Status:</strong> ${statusText}</p>
                    </div>
                `,
                });
                this.logger.log({
                    message: `${this.serviceName}.updateIterationTaskStatus: Email sent`,
                    metadata: {
                        iterationTask,
                        emailSent,
                    },
                });
            } catch (error) {
                this.logger.error({
                    message: `${this.serviceName}.updateIterationTaskStatus: Failed to send email`,
                    metadata: { error: error.message },
                });
            }
            return result;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.updateIterationTaskStatus: Failed to update iteration task status`,
                metadata: { id, status: payload.status, error: error.message },
            });
            throw error;
        }
    }

    async getMonthlyIterationsOfOrganization(organizationId: string) {
        try {
            // Get all projects for the organization
            const projects = await this.projectRepository.find({
                where: { organization_id: organizationId },
            });

            // Get the first and last day of the current month
            const now = new Date();
            const firstDayOfMonth = new Date(
                now.getFullYear(),
                now.getMonth(),
                1,
            );
            const lastDayOfMonth = new Date(
                now.getFullYear(),
                now.getMonth() + 1,
                0,
                23,
                59,
                59,
                999,
            );

            // Find all iterations for these projects created in the current month
            const iterations = await this.iterationRepository.find({
                where: {
                    project_id: In(projects.map((project) => project.id)),
                    created_at: Between(firstDayOfMonth, lastDayOfMonth),
                },
            });

            const iterationCount = iterations.length;

            const subscription = await this.subscriptionRepository.findOne({
                where: { organization_id: organizationId },
            });

            if (!subscription) {
                return {
                    iterations,
                    count: iterationCount,
                    exceeded: iterationCount >= this.freeTierIterationsLimit,
                    tier: "free",
                    remaining: this.freeTierIterationsLimit - iterationCount,
                };
            }
            const exceeded = iterationCount >= this.startupTierIterationsLimit;
            const tier = subscription.tier;
            const remaining = this.startupTierIterationsLimit - iterationCount;

            return {
                iterations,
                count: iterationCount,
                exceeded,
                tier,
                remaining,
            };
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.getMonthlyIterationsOfOrganization: Failed to get monthly iterations`,
                metadata: { organizationId, error: error.message },
            });
            throw error;
        }
    }
}
