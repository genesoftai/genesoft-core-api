import { IsString, IsOptional, IsNotEmpty } from "class-validator";

export class CreateConversationDto {
    @IsString()
    @IsNotEmpty()
    project_id: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    page_id?: string;

    @IsString()
    @IsOptional()
    feature_id?: string;

    @IsString()
    @IsOptional()
    iteration_id?: string;

    @IsString()
    @IsOptional()
    status?: string;
}
