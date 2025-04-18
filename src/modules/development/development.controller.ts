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
    CreateProjectIterationsForCollectionDto,
} from "./dto/create-iteration.dto";
import {
    CreateIterationTaskDto,
    CreateIterationTasksDto,
} from "./dto/create-iteration-task.dto";
import { UpdateIterationTaskStatusDto } from "./dto/update-iteration-task.dto";
import { Iteration } from "./entity/iteration.entity";
import { IterationTask } from "./entity/iteration-task.entity";
import { UpdateIterationStatusDto } from "./dto/update-iteration.dto";
import { IterationStep } from "./entity/iteration-step.entity";

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

    @Get("iteration/organization/:id/monthly")
    getMonthlyIterationsOfOrganization(
        @Param("id") id: string,
    ): Promise<{ iterations: Iteration[]; count: number }> {
        return this.developmentService.getMonthlyIterationsOfOrganization(id);
    }

    @Post("iteration/collection/:id/web")
    createWebIterationByCollectionId(
        @Param("id") id: string,
    ): Promise<Iteration> {
        return this.developmentService.createWebIterationByCollectionId(id);
    }

    @Post("iteration/collection/:id/web-and-backend")
    createProjectIterationsForCollection(
        @Param("id") id: string,
        @Body() payload: CreateProjectIterationsForCollectionDto,
    ): Promise<{
        webIteration: Iteration;
        backendIteration: Iteration;
    }> {
        return this.developmentService.createProjectIterationsForCollection(
            id,
            payload.requirements,
        );
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
        @Param("id") iterationId: string,
        @Body() createIterationTaskDto: CreateIterationTaskDto,
    ): Promise<IterationTask> {
        return this.developmentService.createIterationTask({
            iteration_id: iterationId,
            ...createIterationTaskDto,
        });
    }

    @Post("iteration/:id/iteration-task/bulk")
    async createIterationTasks(
        @Body() createIterationTasksDto: CreateIterationTasksDto,
        @Param("id") id: string,
    ): Promise<{ tasks: IterationTask[] }> {
        const tasks = await this.developmentService.createIterationTasks(
            id,
            createIterationTasksDto,
        );
        return {
            tasks,
        };
    }

    // Additional endpoints
    @Get("iteration/:id/tasks")
    getIterationTasksByIterationId(
        @Param("id") id: string,
    ): Promise<IterationTask[]> {
        return this.developmentService.getIterationTasksByIterationId(id);
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

    @Get("iteration/:id/past-steps/:team")
    getIterationPastSteps(
        @Param("id") id: string,
        @Param("team") team: string,
    ): Promise<object> {
        return this.developmentService.getIterationPastSteps(id, team);
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

    @Put("iteration-task/:id/status")
    updateIterationTaskStatus(
        @Param("id") id: string,
        @Body() payload: UpdateIterationTaskStatusDto,
    ): Promise<IterationTask> {
        return this.developmentService.updateIterationTaskStatus(id, payload);
    }

    // Iteration Step endpoints
    @Post("iteration-step")
    createIterationStep(
        @Body() data: Partial<IterationStep>,
    ): Promise<IterationStep> {
        return this.developmentService.createIterationStep(data);
    }

    @Get("iteration-step/task/:taskId")
    getIterationStepsByTaskId(
        @Param("taskId") taskId: string,
    ): Promise<IterationStep[]> {
        return this.developmentService.getIterationStepsByTaskId(taskId);
    }

    @Get("iteration-step/:id")
    getIterationStepById(@Param("id") id: string): Promise<IterationStep> {
        return this.developmentService.getIterationStepById(id);
    }

    @Put("iteration-step/:id")
    updateIterationStep(
        @Param("id") id: string,
        @Body() data: Partial<IterationStep>,
    ): Promise<IterationStep> {
        return this.developmentService.updateIterationStep(id, data);
    }

    @Delete("iteration-step/:id")
    deleteIterationStep(@Param("id") id: string): Promise<void> {
        return this.developmentService.deleteIterationStep(id);
    }
}
