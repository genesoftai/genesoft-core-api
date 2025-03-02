import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
} from "@nestjs/common";
import { DevelopmentService } from "./development.service";
import {
    CreateIterationDto,
    CreatePageIterationDto,
} from "./dto/create-iteration.dto";
import { CreateTeamTaskDto } from "./dto/create-team-task.dto";
import {
    CreateIterationTaskDto,
    CreateIterationTasksDto,
} from "./dto/create-iteration-task.dto";
import {
    UpdateIterationTaskResultDto,
    UpdateIterationTaskStatusDto,
} from "./dto/update-iteration-task.dto";
import { Iteration } from "./entity/iteration.entity";
import { TeamTask } from "./entity/team-task.entity";
import { IterationTask } from "./entity/iteration-task.entity";
import { UpdateIterationStatusDto } from "./dto/update-iteration.dto";

@Controller("development")
export class DevelopmentController {
    constructor(private readonly developmentService: DevelopmentService) {}

    // Iteration endpoints
    @Post("iteration")
    createIteration(
        @Body() createIterationDto: CreateIterationDto,
    ): Promise<Iteration> {
        return this.developmentService.createIteration(createIterationDto);
    }

    @Get("iteration")
    getIterations(): Promise<Iteration[]> {
        return this.developmentService.getIterations();
    }

    @Get("iteration/:id")
    getIterationById(@Param("id") id: string): Promise<Iteration> {
        return this.developmentService.getIterationById(id);
    }

    @Get("iteration/project/:id")
    getIterationsByProjectId(
        @Param("id") id: string,
        @Query("order") order: "ASC" | "DESC" = "DESC",
    ): Promise<Iteration[]> {
        return this.developmentService.getIterationsByProjectId(id, order);
    }

    @Get("iteration/project/:id/latest")
    getLatestIterationByProjectId(@Param("id") id: string): Promise<object> {
        return this.developmentService.getLatestIterationByProjectId(id);
    }

    @Put("iteration/:id")
    updateIteration(
        @Param("id") id: string,
        @Body() updateData: Partial<Iteration>,
    ): Promise<Iteration> {
        return this.developmentService.updateIteration(id, updateData);
    }

    @Delete("iteration/:id")
    deleteIteration(@Param("id") id: string): Promise<void> {
        return this.developmentService.deleteIteration(id);
    }

    @Put("iteration/:id/status")
    updateIterationStatus(
        @Param("id") id: string,
        @Body() payload: UpdateIterationStatusDto,
    ): Promise<Iteration> {
        return this.developmentService.updateIterationStatus(
            id,
            payload.status,
        );
    }

    // Iteration Task endpoints
    @Post("iteration/:id/iteration-task")
    createIterationTask(
        @Body() createIterationTaskDto: CreateIterationTaskDto,
    ): Promise<IterationTask> {
        return this.developmentService.createIterationTask(
            createIterationTaskDto,
        );
    }

    @Post("iteration/:id/iteration-task/bulk")
    createIterationTasks(
        @Body() createIterationTasksDto: CreateIterationTasksDto,
        @Param("id") id: string,
    ): Promise<IterationTask[]> {
        return this.developmentService.createIterationTasks(
            id,
            createIterationTasksDto,
        );
    }

    @Get("iteration-task")
    getIterationTasks(): Promise<IterationTask[]> {
        return this.developmentService.getIterationTasks();
    }

    @Get("iteration-task/:id")
    getIterationTaskById(@Param("id") id: string): Promise<IterationTask> {
        return this.developmentService.getIterationTaskById(id);
    }

    @Put("iteration-task/:id")
    updateIterationTask(
        @Param("id") id: string,
        @Body() updateData: Partial<IterationTask>,
    ): Promise<IterationTask> {
        return this.developmentService.updateIterationTask(id, updateData);
    }

    @Delete("iteration-task/:id")
    deleteIterationTask(@Param("id") id: string): Promise<void> {
        return this.developmentService.deleteIterationTask(id);
    }

    // Team Task endpoints
    @Post("team-task")
    createTeamTask(
        @Body() createTeamTaskDto: CreateTeamTaskDto,
    ): Promise<TeamTask> {
        return this.developmentService.createTeamTask(createTeamTaskDto);
    }

    @Get("team-task")
    getTeamTasks(): Promise<TeamTask[]> {
        return this.developmentService.getTeamTasks();
    }

    @Get("team-task/:id")
    getTeamTaskById(@Param("id") id: string): Promise<TeamTask> {
        return this.developmentService.getTeamTaskById(id);
    }

    @Put("team-task/:id")
    updateTeamTask(
        @Param("id") id: string,
        @Body() updateData: Partial<TeamTask>,
    ): Promise<TeamTask> {
        return this.developmentService.updateTeamTask(id, updateData);
    }

    @Delete("team-task/:id")
    deleteTeamTask(@Param("id") id: string): Promise<void> {
        return this.developmentService.deleteTeamTask(id);
    }

    // Additional endpoints
    @Get("iteration/:id/tasks")
    getIterationTasksByIterationId(
        @Param("id") id: string,
    ): Promise<IterationTask[]> {
        return this.developmentService.getIterationTasksByIterationId(id);
    }

    @Get("iteration-task/:id/team-tasks")
    getTeamTasksByIterationTaskId(
        @Param("id") id: string,
    ): Promise<TeamTask[]> {
        return this.developmentService.getTeamTasksByIterationTaskId(id);
    }

    @Put("iteration/:id/tasks/status")
    bulkUpdateIterationTaskStatus(
        @Param("id") id: string,
        @Body("status") status: string,
    ): Promise<void> {
        return this.developmentService.bulkUpdateIterationTaskStatus(
            id,
            status,
        );
    }

    @Put("iteration-task/:id/team-tasks/status")
    bulkUpdateTeamTaskStatus(
        @Param("id") id: string,
        @Body("status") status: string,
    ): Promise<void> {
        return this.developmentService.bulkUpdateTeamTaskStatus(id, status);
    }

    @Put("iteration-task/:id/status")
    updateIterationTaskStatus(
        @Param("id") id: string,
        @Body() payload: UpdateIterationTaskStatusDto,
    ): Promise<IterationTask> {
        return this.developmentService.updateIterationTaskStatus(id, payload);
    }

    @Put("iteration-task/:id/result")
    updateIterationTaskResult(
        @Param("id") id: string,
        @Body() payload: UpdateIterationTaskResultDto,
    ): Promise<IterationTask> {
        return this.developmentService.updateIterationTaskResult(id, payload);
    }

    @Get("iteration/:id/next-task")
    getNextIterationTask(
        @Param("id") id: string,
    ): Promise<IterationTask | null> {
        return this.developmentService.getNextIterationTask(id);
    }

    @Post("iteration/:id/next-task")
    triggerNextIterationTask(
        @Param("id") id: string,
    ): Promise<IterationTask | null> {
        return this.developmentService.triggerNextIterationTask(id);
    }

    @Get("iteration/:id/past-steps/:team")
    getIterationPastSteps(
        @Param("id") id: string,
        @Param("team") team: string,
    ): Promise<object> {
        return this.developmentService.getIterationPastSteps(id, team);
    }

    @Post("project/:projectId/update-requirements")
    triggerAiAgentToUpdateRequirements(
        @Param("projectId") projectId: string,
    ): Promise<Iteration> {
        return this.developmentService.triggerAiAgentToUpdateRequirements(
            projectId,
        );
    }

    @Post("page/iteration")
    createPageIteration(
        @Body() payload: CreatePageIterationDto,
    ): Promise<Iteration> {
        return this.developmentService.createPageIteration(payload);
    }

    // @Post("feature/iteration")
    // createFeatureIteration(
    //     @Body() payload: CreateFeatureIterationDto,
    // ): Promise<Iteration> {
    //     return this.developmentService.createFeatureIteration(payload);
    // }
}
