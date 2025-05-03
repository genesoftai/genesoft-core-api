import { IsString, IsOptional, IsNotEmpty, IsArray } from "class-validator";

export class CreateMessageDto {
    @IsNotEmpty()
    @IsString()
    sender_type: string;

    @IsNotEmpty()
    @IsString()
    message_type: string;

    @IsOptional()
    @IsString()
    content?: string;

    @IsString()
    @IsOptional()
    sender_id?: string;

    @IsArray()
    @IsOptional()
    file_ids?: string[];

    @IsArray()
    @IsOptional()
    reference_link_ids?: string[];
}
