import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
} from "@nestjs/common";
import { OnboardingConversationService } from "./onboarding-conversation.service";
import { OnboardingConversation } from "./entity/onboarding-conversation.entity";
import { UpdateConversationDto } from "./dto/update-conversation.dto";
import { CreateMessageDto } from "./dto/create-message.dto";
import { OnboardingConversationMessage } from "./entity/onboarding-conversation-message.entity";
import { SubmitConversationDto } from "./dto/submit-conversation.dto";
import { TalkToAiAgentDto } from "./dto/talk-to-ai-agents.dto";

@Controller("onboarding-conversation")
export class OnboardingConversationController {
    constructor(
        private readonly onboardingConversationService: OnboardingConversationService,
    ) {}

    @Post()
    create(): Promise<OnboardingConversation> {
        return this.onboardingConversationService.createConversation();
    }

    @Get()
    findAll(): Promise<OnboardingConversation[]> {
        return this.onboardingConversationService.findAllConversations();
    }

    @Get(":id")
    findOne(@Param("id") id: string): Promise<object> {
        return this.onboardingConversationService.findConversationById(id);
    }

    @Put(":id")
    update(
        @Param("id") id: string,
        @Body() updateConversationDto: UpdateConversationDto,
    ): Promise<OnboardingConversation> {
        return this.onboardingConversationService.updateConversation(
            id,
            updateConversationDto,
        );
    }

    @Delete(":id")
    remove(@Param("id") id: string): Promise<void> {
        return this.onboardingConversationService.deleteConversation(id);
    }

    @Put(":id/archive")
    archive(@Param("id") id: string): Promise<OnboardingConversation> {
        return this.onboardingConversationService.archiveConversation(id);
    }

    @Post(":id/message")
    addMessage(
        @Param("id") id: string,
        @Body() createMessageDto: CreateMessageDto,
    ): Promise<OnboardingConversationMessage> {
        return this.onboardingConversationService.addMessageToConversation(
            id,
            createMessageDto,
        );
    }

    @Get(":id/message")
    getMessages(
        @Param("id") id: string,
    ): Promise<OnboardingConversationMessage[]> {
        return this.onboardingConversationService.getMessagesForConversation(
            id,
        );
    }

    @Post("talk/ai-agents")
    talkToWebAiAgents(@Body() payload: TalkToAiAgentDto) {
        return this.onboardingConversationService.talkToOnboardingConversationAiAgents(
            payload,
        );
    }

    @Post("submit")
    submitConversation(@Body() payload: SubmitConversationDto) {
        return this.onboardingConversationService.submitConversation(payload);
    }
}
