import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OnboardingConversation } from "./entity/onboarding-conversation.entity";
import { OnboardingConversationMessage } from "./entity/onboarding-conversation-message.entity";
import { OnboardingConversationService } from "./onboarding-conversation.service";
import { MessageService } from "./onboarding-conversation-message.service";
import { OnboardingConversationController } from "./onboarding-conversation.controller";
import { LlmModule } from "@/modules/llm/llm.module";
import { GithubRepository } from "@/modules/github/entity/github-repository.entity";
import { File } from "@/modules/metadata/entity/file.entity";
import { AWSConfigurationModule } from "@/modules/configuration/aws";
@Module({
    imports: [
        TypeOrmModule.forFeature([
            OnboardingConversation,
            OnboardingConversationMessage,
            GithubRepository,
            File,
        ]),
        LlmModule,
        AWSConfigurationModule,
    ],
    controllers: [OnboardingConversationController],
    providers: [OnboardingConversationService, MessageService, Logger],
    exports: [OnboardingConversationService, MessageService],
})
export class OnboardingConversationModule {}
