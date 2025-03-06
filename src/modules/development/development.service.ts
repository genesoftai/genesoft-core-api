import {
    BadRequestException,
    Inject,
    forwardRef,
    Injectable,
    Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { HttpService } from "@nestjs/axios";
import { catchError, concatMap, lastValueFrom, of, retry } from "rxjs";
import { Iteration } from "./entity/iteration.entity";
import { TeamTask } from "./entity/team-task.entity";
import { IterationTask } from "./entity/iteration-task.entity";
import { CreateIterationTasksDto } from "./dto/create-iteration-task.dto";
import {
    UpdateIterationTaskResultDto,
    UpdateIterationTaskStatusDto,
} from "./dto/update-iteration-task.dto";
import {
    IterationStatus,
    IterationTaskStatus,
    IterationType,
} from "@/modules/constants/development";
import { AiAgentTeam } from "@/modules/constants/agent";
import { AiAgentConfigurationService } from "@/modules/configuration/ai-agent/ai-agent.service";
import { ProjectTemplateName } from "../constants/project";
import { EmailService } from "../email/email.service";
import {
    GENESOFT_AI_EMAIL,
    GENESOFT_BASE_URL,
    GENESOFT_SUPPORT_EMAIL_FROM,
} from "@/modules/constants/genesoft";
import { Project } from "@/modules/project/entity/project.entity";
import { Organization } from "../organization/entity/organization.entity";
import { User } from "../user/entity/user.entity";
import {
    CreateFeatureIterationDto,
    CreateIterationDto,
    CreatePageIterationDto,
} from "./dto/create-iteration.dto";
import { ProjectService } from "../project/project.service";
import { RepositoryBuildService } from "../repository-build/repository-build.service";
import { GithubService } from "../github/github.service";
import { PageService } from "@/page/page.service";
import { FeatureService } from "@/feature/feature.service";
import { Conversation } from "@/conversation/entity/conversation.entity";
import { OrganizationService } from "../organization/organization.service";
@Injectable()
export class DevelopmentService {
    private readonly logger = new Logger(DevelopmentService.name);
    private readonly serviceName = "DevelopmentService";

    constructor(
        @InjectRepository(Iteration)
        private iterationRepository: Repository<Iteration>,
        @InjectRepository(TeamTask)
        private teamTaskRepository: Repository<TeamTask>,
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
    ) {}

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
            if (payload.type === IterationType.Project) {
                this.logger.log({
                    message: `${this.serviceName}.createIteration: Create Project iteration`,
                });
                const response = await lastValueFrom(
                    this.httpService.post(
                        `${this.aiAgentConfigurationService.genesoftAiAgentServiceBaseUrl}/api/core-development-agent/development/project`,
                        {
                            project_id: payload.project_id,
                            input: `Develop the project according to the project documentation about overview and branding. Don't start from scratch but plan tasks based on existing code in the frontend github repository. Please use your creativity based on project documentation to satisfy user requirements.`,
                            iteration_id: savedIteration.id,
                            frontend_repo_name: `${ProjectTemplateName.NextJsWeb}_${payload.project_id}`,
                            branch: "dev",
                        },
                    ),
                );
                this.logger.log({
                    message: `${this.serviceName}.createIteration: Project Management AI agent team triggered successfully for update requirements iteration`,
                    metadata: { response: response.data },
                });
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

    async createPageIteration(
        payload: CreatePageIterationDto,
    ): Promise<Iteration> {
        try {
            const conversation = await this.conversationRepository.findOne({
                where: {
                    id: payload.conversation_id,
                },
            });
            const page = await this.pageService.getPage(payload.page_id);
            const iteration = await this.iterationRepository.save({
                project_id: payload.project_id,
                page_id: payload.page_id,
                name: conversation.name,
                type: IterationType.PageDevelopment,
            });

            const response = await lastValueFrom(
                this.httpService
                    .post(
                        `${this.aiAgentConfigurationService.genesoftAiAgentServiceBaseUrl}/api/core-development-agent/development/page`,
                        {
                            project_id: payload.project_id,
                            iteration_id: iteration.id,
                            frontend_repo_name: `${ProjectTemplateName.NextJsWeb}_${payload.project_id}`,
                            input: `Develop the page "${page.name}" in the web application according to the project requirements and conversation between users and Genesoft project manager. Don't start from scratch but plan tasks based on existing code in the frontend github repository.`,
                            page_id: payload.page_id,
                            conversation_id: payload.conversation_id,
                            branch: "dev",
                        },
                    )
                    .pipe(
                        concatMap((res) => of(res.data)),
                        retry(2),
                        catchError((error) => {
                            this.logger.error({
                                message: `${this.serviceName}.createPageIteration: Failed to trigger Developer AI agent`,
                                metadata: { error: error.message },
                            });
                            throw error;
                        }),
                    ),
            );

            this.logger.log({
                message: `${this.serviceName}.createPageIteration: Developer AI agent team triggered successfully for page iteration`,
                metadata: { response },
            });

            return iteration;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.createPageIteration: Failed to create page iteration`,
                metadata: { payload, error: error.message },
            });
            throw error;
        }
    }

    async createFeatureIteration(
        payload: CreateFeatureIterationDto,
    ): Promise<Iteration> {
        try {
            const conversation = await this.conversationRepository.findOne({
                where: {
                    id: payload.conversation_id,
                },
            });
            const feature = await this.featureService.getFeature(
                payload.feature_id,
            );
            const iteration = await this.iterationRepository.save({
                project_id: payload.project_id,
                feature_id: payload.feature_id,
                name: conversation.name,
                type: IterationType.FeatureDevelopment,
            });

            const response = await lastValueFrom(
                this.httpService
                    .post(
                        `${this.aiAgentConfigurationService.genesoftAiAgentServiceBaseUrl}/api/core-development-agent/development/feature`,
                        {
                            project_id: payload.project_id,
                            iteration_id: iteration.id,
                            frontend_repo_name: `${ProjectTemplateName.NextJsWeb}_${payload.project_id}`,
                            input: `Develop the feature "${feature.name}" in the web application according to the project requirements and conversation between users and Genesoft project manager. Don't start from scratch but plan tasks based on existing code in the frontend github repository.`,
                            feature_id: payload.feature_id,
                            conversation_id: payload.conversation_id,
                            branch: "dev",
                        },
                    )
                    .pipe(
                        concatMap((res) => of(res.data)),
                        retry(2),
                        catchError((error) => {
                            this.logger.error({
                                message: `${this.serviceName}.createFeatureIteration: Failed to trigger Developer AI agent`,
                                metadata: { error: error.message },
                            });
                            throw error;
                        }),
                    ),
            );

            this.logger.log({
                message: `${this.serviceName}.createFeatureIteration: Developer AI agent team triggered successfully for feature iteration`,
                metadata: { response },
            });

            return iteration;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.createFeatureIteration: Failed to create feature iteration`,
                metadata: { payload, error: error.message },
            });
            throw error;
        }
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
                updatedIteration.type === IterationType.PageDevelopment
            ) {
                const page = await this.pageService.getPage(
                    conversation.page_id,
                );
                await this.emailService.sendEmail({
                    to: [...userEmails, GENESOFT_AI_EMAIL],
                    subject: `Page development sprint completed for ${conversation.name} sprint`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <img src="https://genesoftai.com/assets/genesoft-logo-blue.png" alt="Genesoft Logo" style="max-width: 150px;">
                            </div>
                            <h2 style="color: #4a86e8; margin-bottom: 20px;">Good News! Your Page Development Sprint is Complete</h2>
                            <p style="font-size: 16px; line-height: 1.5; color: #333;">
                                We're pleased to inform you that the development sprint for your page has been successfully completed.
                            </p>
                            <div style="background-color: #f5f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p style="margin: 0; font-size: 15px;">
                                    <strong>Project:</strong> ${project.name || "No project name provided"}<br>
                                    <strong>Sprint:</strong> ${conversation.name || "No name provided"}<br>
                                    <strong>Page:</strong> ${page.name || "No name provided"}<br>
                                    <strong>Description:</strong> ${page.description || "No description provided"}
                                </p>
                            </div>
                            <p style="font-size: 16px; line-height: 1.5; color: #333;">
                                You can now review the completed work in your project dashboard.
                            </p>
                            <div style="text-align: center; margin: 25px 0;">
                                <a href="${GENESOFT_BASE_URL}/dashboard/project/manage/${updatedIteration.project_id}/pages/${conversation.page_id}" style="background-color: #4a86e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Your Page</a>
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
                updatedIteration.type === IterationType.FeatureDevelopment
            ) {
                const feature = await this.featureService.getFeature(
                    conversation.feature_id,
                );
                await this.emailService.sendEmail({
                    to: [...userEmails, GENESOFT_AI_EMAIL],
                    subject: `Feature development sprint completed for ${conversation.name} sprint`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <img src="https://genesoftai.com/assets/genesoft-logo-blue.png" alt="Genesoft Logo" style="max-width: 150px;">
                            </div>
                            <h2 style="color: #4a86e8; margin-bottom: 20px;">Good News! Your Feature Development Sprint is Complete</h2>
                            <p style="font-size: 16px; line-height: 1.5; color: #333;">
                                We're pleased to inform you that the development sprint for your feature has been successfully completed.
                            </p>
                            <div style="background-color: #f5f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p style="margin: 0; font-size: 15px;">
                                    <strong>Project:</strong> ${project.name || "No project name provided"}<br>
                                    <strong>Sprint:</strong> ${conversation.name || "No name provided"}<br>
                                    <strong>Feature:</strong> ${feature.name || "No name provided"}<br>
                                    <strong>Description:</strong> ${feature.description || "No description provided"}
                                </p>
                            </div>
                            <p style="font-size: 16px; line-height: 1.5; color: #333;">
                                You can now review the completed work in your project dashboard.
                            </p>
                            <div style="text-align: center; margin: 25px 0;">
                                <a href="${GENESOFT_BASE_URL}/dashboard/project/manage/${updatedIteration.project_id}/features/${conversation.feature_id}" style="background-color: #4a86e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Your Feature</a>
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
                updatedIteration.type === IterationType.Project
            ) {
                const project = await this.projectService.getProjectById(
                    updatedIteration.project_id,
                );
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
                                <a href="${GENESOFT_BASE_URL}/dashboard/project/manage/${updatedIteration.project_id}" style="background-color: #4a86e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Your Project</a>
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
            const createdTasks: IterationTask[] = [];

            for (const taskData of payload.tasks) {
                const task = this.iterationTaskRepository.create({
                    ...taskData,
                    iteration_id: iterationId,
                });
                const savedTask = await this.iterationTaskRepository.save(task);
                createdTasks.push(savedTask);
            }

            return createdTasks;
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

    // Team Task CRUD
    async createTeamTask(data: Partial<TeamTask>): Promise<TeamTask> {
        try {
            const teamTask = this.teamTaskRepository.create(data);
            return this.teamTaskRepository.save(teamTask);
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.createTeamTask: Failed to create team task`,
                metadata: { data, error: error.message },
            });
            throw error;
        }
    }

    async getTeamTasks(): Promise<TeamTask[]> {
        try {
            return this.teamTaskRepository.find({
                relations: ["iteration_task"],
            });
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.getTeamTasks: Failed to get team tasks`,
                metadata: { error: error.message },
            });
            throw error;
        }
    }

    async getTeamTaskById(id: string): Promise<TeamTask> {
        try {
            return this.teamTaskRepository.findOneOrFail({
                where: { id },
                relations: ["iteration_task"],
            });
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.getTeamTaskById: Failed to get team task`,
                metadata: { id, error: error.message },
            });
            throw error;
        }
    }

    async updateTeamTask(
        id: string,
        data: Partial<TeamTask>,
    ): Promise<TeamTask> {
        try {
            await this.teamTaskRepository.update(id, data);
            return this.getTeamTaskById(id);
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.updateTeamTask: Failed to update team task`,
                metadata: { id, data, error: error.message },
            });
            throw error;
        }
    }

    async deleteTeamTask(id: string): Promise<void> {
        try {
            await this.teamTaskRepository.delete(id);
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.deleteTeamTask: Failed to delete team task`,
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

    async getTeamTasksByIterationTaskId(
        iterationTaskId: string,
    ): Promise<TeamTask[]> {
        try {
            return this.teamTaskRepository.find({
                where: { iteration_task_id: iterationTaskId },
                relations: ["iteration_task"],
            });
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.getTeamTasksByIterationTaskId: Failed to get team tasks`,
                metadata: { iterationTaskId, error: error.message },
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

    async bulkUpdateTeamTaskStatus(
        iterationTaskId: string,
        status: string,
    ): Promise<void> {
        try {
            await this.teamTaskRepository.update(
                { iteration_task_id: iterationTaskId },
                { status },
            );
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.bulkUpdateTeamTaskStatus: Failed to update team tasks status`,
                metadata: { iterationTaskId, status, error: error.message },
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

    async updateIterationTaskResult(
        id: string,
        payload: UpdateIterationTaskResultDto,
    ): Promise<IterationTask> {
        if (!payload.result) {
            throw new BadRequestException(
                "Result is required to update iteration task result",
            );
        }
        const result = payload.result;

        try {
            const updateData: Partial<IterationTask> = {
                result,
            };

            this.logger.log({
                message: `${this.serviceName}.updateIterationTaskResult: update data`,
                updateData,
            });

            await this.iterationTaskRepository.update(id, updateData);
            return this.getIterationTaskById(id);
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.updateIterationTaskResult: Failed to update iteration task result`,
                metadata: { id, result, error: error.message },
            });
            throw error;
        }
    }

    async getNextIterationTask(
        iterationId: string,
    ): Promise<IterationTask | null> {
        try {
            const tasks = await this.iterationTaskRepository.find({
                where: { iteration_id: iterationId },
                order: { created_at: "ASC" },
            });

            // Find the first task that's not completed
            const nextTask = tasks.find(
                (task) => task.status === IterationTaskStatus.Todo,
            );
            this.logger.log({
                message: `${this.serviceName}.getNextIterationTask: Next iteration task`,
                metadata: { iterationId, nextTask },
            });
            return nextTask || null;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.getNextIterationTask: Failed to get next iteration task`,
                metadata: { iterationId, error: error.message },
            });
            throw error;
        }
    }

    async triggerNextIterationTask(
        iterationId: string,
    ): Promise<IterationTask | null> {
        try {
            const nextTask = await this.getNextIterationTask(iterationId);

            this.logger.log({
                message: `${this.serviceName}.triggerNextIterationTask: Triggering next iteration task`,
                metadata: { iterationId, nextTask },
            });

            if (!nextTask) {
                // No more tasks to process
                await this.updateIteration(iterationId, {
                    status: IterationStatus.Done,
                });

                const iteration = await this.getIterationById(iterationId);
                try {
                    await this.repositoryBuildService.checkRepositoryBuild({
                        project_id: iteration.project_id,
                        iteration_id: iteration.id,
                        template: ProjectTemplateName.NextJsWeb,
                    });
                    this.emailService.sendEmail({
                        from: "Genesoft <support@genesoftai.com>",
                        to: [GENESOFT_AI_EMAIL],
                        subject: `Frontend repository build for ${iteration.project_id} checked successfully`,
                        html: `
                        <p>Hello,</p>
                        <p>The frontend repository build for ${iteration.project_id} checked successfully.</p>
                        <p>Thank you.</p>

                        Project ID: ${iteration.project_id}
                        Iteration ID: ${iteration.id}
                        `,
                    });
                } catch (error) {
                    this.logger.error({
                        message: `${this.serviceName}.triggerNextIterationTask: Failed to check frontend repository build`,
                        metadata: { iteration, error: error.message },
                    });
                    this.emailService.sendEmail({
                        from: "Genesoft <support@genesoftai.com>",
                        to: [GENESOFT_AI_EMAIL],
                        subject: `Failed to check frontend repository build for ${iteration.project_id}`,
                        html: `
                        <p>Hello,</p>
                        <p>We are unable to check the frontend repository build for ${iteration.project_id}.</p>
                        <p>Please check the repository build status manually.</p>
                        <p>Thank you.</p>

                        Project ID: ${iteration.project_id}
                        Iteration ID: ${iteration.id}
                        `,
                    });
                }

                return null;
            }

            if (nextTask.status === IterationTaskStatus.Todo) {
                const iteration = await this.getIterationById(iterationId);
                // Update the task status to in_progress
                await this.updateIterationTaskStatus(nextTask.id, {
                    status: IterationTaskStatus.InProgress,
                });

                // ! Why condition after this not working?
                // TODO: Make condition after this working when trigger next iteration task
                try {
                    this.logger.log({
                        message: `${this.serviceName}.triggerNextIterationTask: Triggering AI agent`,
                        metadata: { nextTask },
                    });
                    if (nextTask.team === AiAgentTeam.Frontend) {
                        // Trigger frontend AI agent
                        const response = await lastValueFrom(
                            this.httpService.post(
                                `${this.aiAgentConfigurationService.genesoftAiAgentServiceBaseUrl}/api/frontend-development/development/requirements`,
                                {
                                    project_id: iteration.project_id,
                                    iteration_id: iteration.id,
                                    iteration_task_id: nextTask.id,
                                    frontend_repo_name: `${ProjectTemplateName.NextJsWeb}_${iteration.project_id}`,
                                    backend_repo_name: `${ProjectTemplateName.NestJsApi}_${iteration.project_id}`,
                                },
                            ),
                        );
                        this.logger.log({
                            message: `${this.serviceName}.triggerNextIterationTask: Frontend AI agent triggered successfully`,
                            metadata: { response: response.data },
                        });
                    } else if (nextTask.team === AiAgentTeam.Backend) {
                        // Trigger backend AI agent
                        // const response = await lastValueFrom(
                        //     this.httpService.post(
                        //         `${this.aiAgentConfigurationService.genesoftAiAgentServiceBaseUrl}/api/backend-development/development/requirements`,
                        //         {
                        //             project_id: iteration.project_id,
                        //             iteration_id: iteration.id,
                        //             iteration_task_id: nextTask.id,
                        //             backend_repo_name: `${ProjectTemplateName.NestJsApi}_${iteration.project_id}`,
                        //         },
                        //     ),
                        // );
                        this.logger.log({
                            message: `${this.serviceName}.triggerNextIterationTask: Backend AI agent Not supported`,
                            metadata: { nextTask },
                        });
                    } else {
                        this.logger.error({
                            message: `${this.serviceName}.triggerNextIterationTask: Invalid team for iteration task`,
                            metadata: { nextTask },
                        });
                        throw new BadRequestException(
                            "Invalid team for iteration task",
                        );
                    }
                } catch (error) {
                    this.logger.error({
                        message: `${this.serviceName}.triggerNextIterationTask: Failed to trigger AI agent`,
                        metadata: { nextTask, error: error.message },
                    });
                    // Update task status back to todo since agent trigger failed
                    await this.updateIterationTaskStatus(nextTask.id, {
                        status: IterationTaskStatus.Failed,
                    });
                    throw error;
                }

                return this.getIterationTaskById(nextTask.id);
            }

            return nextTask;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.triggerNextIterationTask: Failed to trigger next iteration task`,
                metadata: { iterationId, error: error.message },
            });
            throw error;
        }
    }

    async triggerAiAgentToUpdateRequirements(projectId: string) {
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
        });

        const iteration = await this.createIteration({
            project_id: project.id,
            type: IterationType.Requirements,
            is_updated_requirements: true,
        });

        return iteration;
    }
}
