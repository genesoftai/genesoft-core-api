import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OnboardingConversationMessage } from "./entity/onboarding-conversation-message.entity";
import { CreateMessageDto } from "./dto/create-message.dto";

@Injectable()
export class MessageService {
    constructor(
        @InjectRepository(OnboardingConversationMessage)
        private messageRepository: Repository<OnboardingConversationMessage>,
    ) {}

    async createMessage(
        createMessageDto: CreateMessageDto,
    ): Promise<OnboardingConversationMessage> {
        const message = this.messageRepository.create(createMessageDto);
        return this.messageRepository.save(message);
    }

    async findMessageById(id: string): Promise<OnboardingConversationMessage> {
        const message = await this.messageRepository.findOne({ where: { id } });
        if (!message) {
            throw new NotFoundException(`Message with ID ${id} not found`);
        }
        return message;
    }

    async updateMessage(
        id: string,
        updateData: Partial<CreateMessageDto>,
    ): Promise<OnboardingConversationMessage> {
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
    ): Promise<OnboardingConversationMessage[]> {
        return this.messageRepository.find({
            where: { sender_id: senderId },
            order: { created_at: "DESC" },
        });
    }

    async findMessagesByType(
        messageType: string,
    ): Promise<OnboardingConversationMessage[]> {
        return this.messageRepository.find({
            where: { message_type: messageType },
            order: { created_at: "DESC" },
        });
    }
}
