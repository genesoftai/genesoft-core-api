import { IsNotEmpty, IsOptional, ValidateNested } from "class-validator";

import { IsString } from "class-validator";
import { CreateMessageDto } from "./create-message.dto";
import { Type } from "class-transformer";

export class TalkToProjectManagerDto {
    @IsNotEmpty()
    @IsString()
    project_id: string;

    @IsOptional()
    @IsString()
    conversation_id?: string;

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => CreateMessageDto)
    message: CreateMessageDto;

    @IsOptional()
    @IsString()
    feature_id?: string;

    @IsOptional()
    @IsString()
    page_id?: string;
}

export class TalkToBackendDeveloperDto {
    @IsNotEmpty()
    @IsString()
    project_id: string;

    @IsOptional()
    @IsString()
    conversation_id?: string;

    @IsNotEmpty()
    @ValidateNested()
    @Type(() => CreateMessageDto)
    message: CreateMessageDto;
}
