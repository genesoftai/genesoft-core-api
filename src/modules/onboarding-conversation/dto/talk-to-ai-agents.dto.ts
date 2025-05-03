import { IsNotEmpty, IsOptional, ValidateNested } from "class-validator";

import { IsString } from "class-validator";
import { CreateMessageDto } from "./create-message.dto";
import { Type } from "class-transformer";

export class TalkToAiAgentDto {
    @IsOptional()
    @IsString()
    conversation_id?: string;

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => CreateMessageDto)
    message: CreateMessageDto;
}
