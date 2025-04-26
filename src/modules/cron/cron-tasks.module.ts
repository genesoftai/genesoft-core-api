import { Module, Logger } from "@nestjs/common";
import { CronTasksService } from "./cron-tasks.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Iteration } from "../development/entity/iteration.entity";
import { BackendInfraModule } from "../backend-infra/backend-infra.module";

@Module({
    imports: [TypeOrmModule.forFeature([Iteration]), BackendInfraModule],
    controllers: [],
    providers: [CronTasksService, Logger],
    exports: [CronTasksService],
})
export class CronTasksModule {}