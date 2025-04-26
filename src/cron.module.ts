import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { CronTasksModule } from "./modules/cron/cron-tasks.module";

@Module({
    imports: [ScheduleModule.forRoot(), CronTasksModule],
})
export class CronModule {}
