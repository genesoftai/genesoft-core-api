import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Iteration } from "../development/entity/iteration.entity";
import { BackendInfraService } from "../backend-infra/backend-infra.service";

@Injectable()
export class CronTasksService {
    private readonly logger = new Logger(CronTasksService.name);

    constructor(
        @InjectRepository(Iteration)
        private readonly iterationRepository: Repository<Iteration>,
        private readonly backendInfraService: BackendInfraService,
    ) {}

    // Example of a cron job that runs every day at midnight
    @Cron("0 0 * * *")
    handleDailyTask() {
        this.logger.debug("Running daily cron job at midnight");
        // Implement your cron logic here
    }

    // Example of a cron job that runs every hour
    @Cron("0 * * * *")
    handleHourlyTask() {
        this.logger.debug("Running hourly cron job");
        // Implement your cron logic here
    }

    // Check for tasks with todo status every 5 minutes
    @Cron("*/5 * * * *")
    async checkTodoTasks() {}
}
