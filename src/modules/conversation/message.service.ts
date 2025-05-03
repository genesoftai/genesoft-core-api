import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConversationMessage } from "./entity/message.entity";
import { CreateMessageDto } from "./dto/create-message.dto";

@Injectable()
export class MessageService {
    constructor(
        @InjectRepository(ConversationMessage)
        private messageRepository: Repository<ConversationMessage>,
    ) {}

    async createMessage(
        createMessageDto: CreateMessageDto,
    ): Promise<ConversationMessage> {
        const message = this.messageRepository.create(createMessageDto);
        return this.messageRepository.save(message);
    }

    async findMessageById(id: string): Promise<ConversationMessage> {
        const message = await this.messageRepository.findOne({ where: { id } });
        if (!message) {
            throw new NotFoundException(`Message with ID ${id} not found`);
        }
        return message;
    }

    async updateMessage(
        id: string,
        updateData: Partial<CreateMessageDto>,
    ): Promise<ConversationMessage> {
        const message = await this.findMessageById(id);

        // Only allow updating content and file_ids
        if (updateData.content) message.content = updateData.content;
        if (updateData.file_ids) message.file_ids = updateData.file_ids;
        if (updateData.reference_link_ids)
            message.reference_link_ids = updateData.reference_link_ids;

        return this.messageRepository.save(message);
    }

    async deleteMessage(id: string): Promise<void> {
        const result = await this.messageRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Message with ID ${id} not found`);
        }
    }

    async findMessagesBySenderId(
        senderId: string,
    ): Promise<ConversationMessage[]> {
        return this.messageRepository.find({
            where: { sender_id: senderId },
            order: { created_at: "DESC" },
        });
    }

    async findMessagesByType(
        messageType: string,
    ): Promise<ConversationMessage[]> {
        return this.messageRepository.find({
            where: { message_type: messageType },
            order: { created_at: "DESC" },
        });
    }

    async searchMessagesContent(
        searchTerm: string,
    ): Promise<ConversationMessage[]> {
        return this.messageRepository
            .createQueryBuilder("message")
            .where("message.content ILIKE :searchTerm", {
                searchTerm: `%${searchTerm}%`,
            })
            .orderBy("message.created_at", "DESC")
            .getMany();
    }

    async getMessageWithAttachments(id: string): Promise<ConversationMessage> {
        const message = await this.findMessageById(id);
        // Here you would typically load related file data based on file_ids
        // This is a placeholder for that functionality
        return message;
    }
}
