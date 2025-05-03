import { IsOptional, IsString } from "class-validator";

export class UpdateConversationDto {
    @IsString()
    @IsOptional()
    project_id?: string;

    @IsString()
    @IsOptional()
    collection_id?: string;

    @IsString()
    @IsOptional()
    status?: string;
}
