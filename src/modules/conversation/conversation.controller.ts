import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
} from "@nestjs/common";
import { ConversationService } from "./conversation.service";
import { Conversation } from "./entity/conversation.entity";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { UpdateConversationDto } from "./dto/update-conversation.dto";
import { CreateMessageDto } from "./dto/create-message.dto";
import { ConversationMessage } from "./entity/message.entity";
import {
    SendMessageInAskModeToAiAgentDto,
    SubmitTaskToAiAgentDto,
    TalkToBackendDeveloperDto,
    TalkToProjectManagerDto,
    TalkToWebAiAgentsDto,
} from "./dto/talk-to-ai-agent.dto";
import { SubmitConversationDto } from "./dto/submit-conversation.dto";

@Controller("conversation")
export class ConversationController {
    constructor(private readonly conversationService: ConversationService) {}

    @Post()
    create(
        @Body() createConversationDto: CreateConversationDto,
    ): Promise<Conversation> {
        return this.conversationService.createConversation(
            createConversationDto,
        );
    }

    @Get()
    findAll(): Promise<Conversation[]> {
        return this.conversationService.findAllConversations();
    }

    @Get("page/:pageId")
    findByPageId(@Param("pageId") pageId: string): Promise<Conversation[]> {
        return this.conversationService.findConversationsByPageId(pageId);
    }

    @Get("feature/:featureId")
    findByFeatureId(
        @Param("featureId") featureId: string,
    ): Promise<Conversation[]> {
        return this.conversationService.findConversationsByFeatureId(featureId);
    }

    @Get("project/:projectId")
    findByProjectId(
        @Param("projectId") projectId: string,
    ): Promise<Conversation[]> {
        return this.conversationService.findConversationsByProjectId(projectId);
    }

    @Get("project/:projectId/iterations")
    findIterationsByProjectId(@Param("projectId") projectId: string) {
        return this.conversationService.findConversationsWithIterationsByProjectId(
            projectId,
        );
    }

    @Get("iteration/:iterationId")
    findByIterationId(
        @Param("iterationId") iterationId: string,
    ): Promise<Conversation[]> {
        return this.conversationService.findConversationsByIterationId(
            iterationId,
        );
    }

    @Get(":id")
    findOne(@Param("id") id: string): Promise<object> {
        return this.conversationService.findConversationById(id);
    }

    @Put(":id")
    update(
        @Param("id") id: string,
        @Body() updateConversationDto: UpdateConversationDto,
    ): Promise<Conversation> {
        return this.conversationService.updateConversation(
            id,
            updateConversationDto,
        );
    }

    @Delete(":id")
    remove(@Param("id") id: string): Promise<void> {
        return this.conversationService.deleteConversation(id);
    }

    @Put(":id/archive")
    archive(@Param("id") id: string): Promise<Conversation> {
        return this.conversationService.archiveConversation(id);
    }

    @Post(":id/message")
    addMessage(
        @Param("id") id: string,
        @Body() createMessageDto: CreateMessageDto,
    ): Promise<ConversationMessage> {
        return this.conversationService.addMessageToConversation(
            id,
            createMessageDto,
        );
    }

    @Get(":id/message")
    getMessages(@Param("id") id: string): Promise<ConversationMessage[]> {
        return this.conversationService.getMessagesForConversation(id);
    }

    @Get(":id/message/latest")
    getLatestMessage(@Param("id") id: string): Promise<ConversationMessage> {
        return this.conversationService.getLatestMessageByConversationId(id);
    }

    @Get("page/:pageId/active")
    getActiveConversationByPageId(
        @Param("pageId") pageId: string,
    ): Promise<Conversation> {
        return this.conversationService.getActiveConversationByPageId(pageId);
    }

    @Get("feature/:featureId/active")
    getActiveConversationByFeatureId(
        @Param("featureId") featureId: string,
    ): Promise<Conversation> {
        return this.conversationService.getActiveConversationByFeatureId(
            featureId,
        );
    }

    @Get("project/:projectId/active")
    getActiveConversationByProjectId(
        @Param("projectId") projectId: string,
    ): Promise<Conversation> {
        return this.conversationService.getActiveConversationByProjectId(
            projectId,
        );
    }

    @Get("branch/:github_branch_id")
    getConversationByBranchId(
        @Param("github_branch_id") github_branch_id: string,
    ) {
        return this.conversationService.getConversationByBranchId(
            github_branch_id,
        );
    }

    @Post("message/ask")
    talkToUserAsk(@Body() payload: SendMessageInAskModeToAiAgentDto) {
        return this.conversationService.sendMessageByUserInAskMode(payload);
    }

    @Post("message/task")
    submitTask(@Body() payload: SubmitTaskToAiAgentDto) {
        return this.conversationService.submitTask(payload);
    }

    @Get("message/branch/:github_branch_id")
    getMessagesByBranchId(@Param("github_branch_id") github_branch_id: string) {
        return this.conversationService.getMessagesByBranchId(github_branch_id);
    }

    // @Post("message/task")
    // talkToUser(@Body() payload: SendMessageToAiAgentDto) {
    //     return this.conversationService.sendMessageByUser(payload);
    // }

    @Post("talk/web-ai-agents")
    talkToWebAiAgents(@Body() payload: TalkToWebAiAgentsDto) {
        return this.conversationService.talkToWebAiAgents(payload);
    }

    @Post("talk/project-manager")
    talkToProjectManager(@Body() payload: TalkToProjectManagerDto) {
        return this.conversationService.talkToProjectManager(payload);
    }

    @Post("talk/backend-developer")
    talkToBackendDeveloper(@Body() payload: TalkToBackendDeveloperDto) {
        return this.conversationService.talkToBackendDeveloper(payload);
    }

    @Post("submit")
    submitConversation(@Body() payload: SubmitConversationDto) {
        return this.conversationService.submitConversation(payload);
    }
}
