import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
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
import { GENESOFT_SUPPORT_EMAIL } from "@/modules/constants/genesoft";
import { Project } from "@/modules/project/entity/project.entity";
import { Organization } from "../organization/entity/organization.entity";
import { User } from "../user/entity/user.entity";
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
        private readonly httpService: HttpService,
        private readonly aiAgentConfigurationService: AiAgentConfigurationService,
        private readonly emailService: EmailService,
        @InjectRepository(Project)
        private projectRepository: Repository<Project>,
        @InjectRepository(Organization)
        private organizationRepository: Repository<Organization>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {}

    // Iteration CRUD
    async createIteration(data: Partial<Iteration>): Promise<Iteration> {
        try {
            const iteration = this.iterationRepository.create(data);
            const savedIteration =
                await this.iterationRepository.save(iteration);
            if (data.type === IterationType.Feedback) {
                // TODO: Call Project Management AI agent team to list tasks
            } else if (data.type === IterationType.Requirements) {
                // TODO: Call Project Management AI agent team to list tasks
                const response = await lastValueFrom(
                    this.httpService.post(
                        `${this.aiAgentConfigurationService.genesoftAiAgentServiceBaseUrl}/api/project-management/development/requirements`,
                        {
                            project_id: data.project_id,
                            input: `Plan and Prioritize Frontend team and Backend team tasks for develop web application follow project requirements by customer, Don't start from scratch but plan tasks further based on code existing in github repositories of frontend and backend`,
                            iteration_id: savedIteration.id,
                            frontend_repo_name: `${ProjectTemplateName.NextJsWeb}_${data.project_id}`,
                            backend_repo_name: `${ProjectTemplateName.NestJsApi}_${data.project_id}`,
                        },
                    ),
                );
                this.logger.log({
                    message: `${this.serviceName}.createIteration: Project Management AI agent team triggered successfully`,
                    metadata: { response: response.data },
                });
            }
            return savedIteration;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.createIteration: Failed to create iteration`,
                metadata: { data, error: error.message },
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

    // Iteration Task CRUD
    async createIterationTask(
        data: Partial<IterationTask>,
    ): Promise<IterationTask> {
        try {
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
            this.logger.log({
                message: `${this.serviceName}.updateIterationTaskStatus: Project`,
                metadata: { project },
            });
            const organization = await this.organizationRepository.findOne({
                where: { id: project.organization_id },
            });
            this.logger.log({
                message: `${this.serviceName}.updateIterationTaskStatus: Organization`,
                metadata: { organization },
            });
            const users = await this.userRepository.find({
                where: { organization_id: organization.id },
            });
            this.logger.log({
                message: `${this.serviceName}.updateIterationTaskStatus: Users`,
                metadata: { users },
            });
            const result = await this.updateIterationTask(id, {
                status: payload.status,
            });
            this.logger.log({
                message: `${this.serviceName}.updateIterationTaskStatus: Result`,
                metadata: { result },
            });
            try {
                const usersEmails = users.map((user) => user.email);
                const emailSent = await this.emailService.sendEmail({
                    from: GENESOFT_SUPPORT_EMAIL,
                    to: usersEmails,
                    subject: "Iteration Task Result",
                    html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2>Project: ${project.name}</h2>
                        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                        <h3>Development Round Details</h3>
                        <p><strong>Iteration ID:</strong> ${iteration.id}</p>
                        <p><strong>Iteration Type:</strong> ${iteration.type}</p>
                        <p><strong>Iteration Status:</strong> ${iteration.status}</p>
                        <h3>Task Details</h3>
                        <p><strong>Task Name:</strong> ${iterationTask.name}</p>
                        <p><strong>Description:</strong> ${iterationTask.description}</p>
                        <p><strong>Team:</strong> ${iterationTask.team}</p>
                        <p><strong>Status:</strong> ${payload.status}</p>
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
                        const response = await lastValueFrom(
                            this.httpService.post(
                                `${this.aiAgentConfigurationService.genesoftAiAgentServiceBaseUrl}/api/backend-development/development/requirements`,
                                {
                                    project_id: iteration.project_id,
                                    iteration_id: iteration.id,
                                    iteration_task_id: nextTask.id,
                                    backend_repo_name: `${ProjectTemplateName.NestJsApi}_${iteration.project_id}`,
                                },
                            ),
                        );
                        this.logger.log({
                            message: `${this.serviceName}.triggerNextIterationTask: Backend AI agent triggered successfully`,
                            metadata: { response: response.data },
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
}
