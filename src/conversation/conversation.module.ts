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
import { FeatureModule } from "@/feature/feature.module";
import { PageModule } from "@/page/page.module";
import { EmailModule } from "@/modules/email/email.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Conversation,
            ConversationMessage,
            GithubRepository,
        ]),
        UserModule,
        GithubModule,
        LlmModule,
        EmailModule,
        forwardRef(() => ProjectModule),
        forwardRef(() => DevelopmentModule),
        forwardRef(() => PageModule),
        forwardRef(() => FeatureModule),
    ],
    controllers: [ConversationController],
    providers: [ConversationService, MessageService, Logger],
    exports: [ConversationService, MessageService],
})
export class ConversationModule {}
