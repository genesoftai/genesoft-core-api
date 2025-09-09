import { forwardRef, Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Conversation } from "./entity/conversation.entity";
import { ConversationMessage } from "./entity/message.entity";
import { ConversationService } from "./conversation.service";
import { MessageService } from "./message.service";
import { ConversationController } from "./conversation.controller";
import { UserModule } from "@/modules/user/user.module";
import { ProjectModule } from "@/modules/project/project.module";
import { GithubModule } from "@/modules/github/github.module";
import { LlmModule } from "@/modules/llm/llm.module";
import { GithubRepository } from "@/modules/github/entity/github-repository.entity";
import { DevelopmentModule } from "@/modules/development/development.module";
import { FeatureModule } from "@/modules/feature/feature.module";
import { PageModule } from "@/modules/page/page.module";
import { EmailModule } from "@/modules/email/email.module";
import { Page } from "@/modules/project/entity/page.entity";
import { Iteration } from "@/modules/development/entity/iteration.entity";
import { IterationTask } from "@/modules/development/entity/iteration-task.entity";
import { File } from "@/modules/metadata/entity/file.entity";
import { AWSConfigurationModule } from "@/modules/configuration/aws";
import { GithubBranch } from "../github-management/entity/github-branch.entity";
import { GithubManagementModule } from "../github-management/github-management.module";
import { IterationStep } from "../development/entity/iteration-step.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Conversation,
            ConversationMessage,
            GithubRepository,
            Page,
            Iteration,
            IterationTask,
            File,
            GithubBranch,
            IterationStep,
        ]),
        UserModule,
        GithubModule,
        LlmModule,
        EmailModule,
        forwardRef(() => ProjectModule),
        forwardRef(() => DevelopmentModule),
        forwardRef(() => PageModule),
        forwardRef(() => FeatureModule),
        AWSConfigurationModule,
        forwardRef(() => GithubManagementModule),
    ],
    controllers: [ConversationController],
    providers: [ConversationService, MessageService, Logger],
    exports: [ConversationService, MessageService],
})
export class ConversationModule {}
