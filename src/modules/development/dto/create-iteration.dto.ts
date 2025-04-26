import { IsString, IsOptional, IsNotEmpty, IsBoolean } from "class-validator";

export class CreateIterationDto {
    @IsString()
    @IsNotEmpty()
    project_id: string;

    @IsString()
    @IsNotEmpty()
    type: string;

    @IsString()
    @IsOptional()
    project_template_type?: string;

    @IsString()
    @IsOptional()
    feedback_id?: string;

    @IsBoolean()
    @IsOptional()
    is_updated_requirements?: boolean;

    @IsBoolean()
    @IsOptional()
    is_supabase_integration?: boolean;

    @IsString()
    @IsOptional()
    conversation_id?: string;

    @IsString()
    @IsOptional()
    sandbox_id?: string;

    @IsBoolean()
    @IsOptional()
    is_create_web_project?: boolean;

    @IsString()
    @IsOptional()
    collection_id?: string;
}

export class CreateProjectIterationsForCollectionDto {
    @IsString()
    @IsNotEmpty()
    requirements: string;
}
