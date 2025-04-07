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
    @IsNotEmpty()
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
}

export class CreatePageIterationDto {
    @IsString()
    @IsNotEmpty()
    conversation_id: string;

    @IsString()
    @IsNotEmpty()
    project_id: string;

    @IsString()
    @IsNotEmpty()
    page_id: string;
}

export class CreateFeatureIterationDto {
    @IsString()
    @IsNotEmpty()
    conversation_id: string;

    @IsString()
    @IsNotEmpty()
    project_id: string;

    @IsString()
    @IsNotEmpty()
    feature_id: string;
}
