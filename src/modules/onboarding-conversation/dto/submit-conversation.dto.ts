import { IsString, IsNotEmpty } from "class-validator";

export class SubmitConversationDto {
    @IsNotEmpty()
    @IsString()
    conversation_id: string;
}
