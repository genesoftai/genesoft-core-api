import { IsNotEmpty, ValidateNested } from "class-validator";

import { IsString } from "class-validator";
import { CreateMessageDto } from "./create-message.dto";
import { Type } from "class-transformer";

export class TalkToProjectManagerDto {
    @IsNotEmpty()
    @IsString()
    project_id: string;

    @IsNotEmpty()
    @IsString()
    conversation_id: string;

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => CreateMessageDto)
    message: CreateMessageDto;
}
