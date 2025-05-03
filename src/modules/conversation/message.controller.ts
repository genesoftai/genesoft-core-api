import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    Query,
} from "@nestjs/common";
import { MessageService } from "./message.service";
import { ConversationMessage } from "./entity/message.entity";
import { CreateMessageDto } from "./dto/create-message.dto";

@Controller("messages")
export class MessageController {
    constructor(private readonly messageService: MessageService) {}

    @Post()
    create(
        @Body() createMessageDto: CreateMessageDto,
    ): Promise<ConversationMessage> {
        return this.messageService.createMessage(createMessageDto);
    }

    @Get(":id")
    findOne(@Param("id") id: string): Promise<ConversationMessage> {
        return this.messageService.findMessageById(id);
    }

    @Put(":id")
    update(
        @Param("id") id: string,
        @Body() updateData: Partial<CreateMessageDto>,
    ): Promise<ConversationMessage> {
        return this.messageService.updateMessage(id, updateData);
    }

    @Delete(":id")
    remove(@Param("id") id: string): Promise<void> {
        return this.messageService.deleteMessage(id);
    }

    @Get("sender/:senderId")
    findBySender(
        @Param("senderId") senderId: string,
    ): Promise<ConversationMessage[]> {
        return this.messageService.findMessagesBySenderId(senderId);
    }

    @Get("type/:messageType")
    findByType(
        @Param("messageType") messageType: string,
    ): Promise<ConversationMessage[]> {
        return this.messageService.findMessagesByType(messageType);
    }

    @Get("search")
    search(@Query("term") searchTerm: string): Promise<ConversationMessage[]> {
        return this.messageService.searchMessagesContent(searchTerm);
    }

    @Get(":id/attachments")
    getWithAttachments(@Param("id") id: string): Promise<ConversationMessage> {
        return this.messageService.getMessageWithAttachments(id);
    }
}
