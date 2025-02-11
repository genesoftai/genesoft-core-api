import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { DevelopmentController } from "./development.controller";
import { DevelopmentService } from "./development.service";
import { Iteration } from "./entity/iteration.entity";
import { TeamTask } from "./entity/team-task.entity";
import { IterationTask } from "./entity/iteration-task.entity";
import { AiAgentConfigurationModule } from "@/modules/configuration/ai-agent/ai-agent.module";
import { EmailModule } from "../email/email.module";
import { Project } from "../project/entity/project.entity";
import { Organization } from "../organization/entity/organization.entity";
import { User } from "../user/entity/user.entity";
import { ProjectModule } from "../project/project.module";
import { RepositoryBuildModule } from "../repository-build/repository-build.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Iteration,
            TeamTask,
            IterationTask,
            Project,
            Organization,
            User,
        ]),
        HttpModule,
        AiAgentConfigurationModule,
        EmailModule,
        ProjectModule,
        RepositoryBuildModule,
    ],
    controllers: [DevelopmentController],
    providers: [DevelopmentService, Logger],
    exports: [DevelopmentService],
})
export class DevelopmentModule {}
