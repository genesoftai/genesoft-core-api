import { Logger, Module, forwardRef } from "@nestjs/common";
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
import { GithubModule } from "../github/github.module";
import { PageModule } from "@/page/page.module";
import { FeatureModule } from "@/feature/feature.module";
import { Conversation } from "@/conversation/entity/conversation.entity";
import { OrganizationModule } from "../organization/organization.module";
import { Subscription } from "../subscription/entity/subscription.entity";
import { AppConfigurationModule } from "../configuration/app";
import { Collection } from "../collection/entity/collection.entity";
import { ConversationModule } from "@/conversation/conversation.module";
@Module({
    imports: [
        TypeOrmModule.forFeature([
            Iteration,
            TeamTask,
            IterationTask,
            Project,
            Organization,
            User,
            Conversation,
            Subscription,
            Collection,
        ]),
        HttpModule,
        AiAgentConfigurationModule,
        EmailModule,
        RepositoryBuildModule,
        forwardRef(() => ProjectModule),
        GithubModule,
        PageModule,
        FeatureModule,
        OrganizationModule,
        AppConfigurationModule,
        ConversationModule,
    ],
    controllers: [DevelopmentController],
    providers: [DevelopmentService, Logger],
    exports: [DevelopmentService],
})
export class DevelopmentModule {}
