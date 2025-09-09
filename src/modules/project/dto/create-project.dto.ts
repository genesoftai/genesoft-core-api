import {
    IsString,
    IsUUID,
    IsOptional,
    IsArray,
    ValidateNested,
    IsNotEmpty,
    IsBoolean,
    IsNumber,
} from "class-validator";
import { Type } from "class-transformer";

class BrandingDto {
    @IsOptional()
    @IsString()
    logo_url?: string;

    @IsOptional()
    @IsString()
    color?: string;

    @IsOptional()
    @IsString()
    theme?: string;

    @IsOptional()
    @IsString()
    perception?: string;
}

class PageDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsOptional()
    @IsArray()
    file_ids?: string[];

    @IsOptional()
    @IsArray()
    reference_link_ids?: string[];
}

class FeatureDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsOptional()
    @IsArray()
    file_ids?: string[];

    @IsOptional()
    @IsArray()
    reference_link_ids?: string[];
}

export class CreateProjectDto {
    @IsNotEmpty()
    @IsUUID()
    organization_id: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    backend_requirements?: string;

    @IsNotEmpty()
    @IsString()
    project_type: string;

    @IsOptional()
    @IsString()
    purpose?: string;

    @IsOptional()
    @IsString()
    target_audience?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => BrandingDto)
    branding?: BrandingDto;

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => PageDto)
    pages?: PageDto[];

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => FeatureDto)
    features?: FeatureDto[];

    @IsOptional()
    @IsBoolean()
    is_create_iteration?: boolean;

    @IsOptional()
    @IsString()
    onboarding_conversation_id?: string;

    @IsOptional()
    @IsString()
    figma_file_key?: string;
}

export class CreateProjectFromGithubDto extends CreateProjectDto {
    @IsNotEmpty()
    @IsString()
    github_repo_owner: string;

    @IsNotEmpty()
    @IsString()
    github_repo_name: string;

    @IsNotEmpty()
    @IsNumber()
    github_installation_id: number;

    @IsOptional()
    @IsString()
    github_repo_branch?: string;

    @IsOptional()
    @IsString()
    github_repo_type?: string;

    @IsOptional()
    @IsString()
    github_repo_id?: string;
}

export class CreateProjectFromOnboardingDto {
    @IsNotEmpty()
    @IsUUID()
    user_id: string;

    @IsNotEmpty()
    @IsString()
    project_type: string;

    @IsOptional()
    @IsString()
    project_description?: string;

    @IsOptional()
    @IsString()
    backend_requirements?: string;

    @IsOptional()
    @IsString()
    project_name?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => BrandingDto)
    branding?: BrandingDto;

    @IsOptional()
    @IsString()
    onboarding_conversation_id?: string;

    @IsOptional()
    @IsString()
    figma_file_key?: string;

    @IsOptional()
    @IsString()
    github_repo_owner?: string;

    @IsOptional()
    @IsString()
    github_repo_name?: string;

    @IsOptional()
    @IsNumber()
    github_installation_id?: number;

    @IsOptional()
    @IsString()
    github_repo_branch?: string;

    @IsOptional()
    @IsString()
    github_repo_type?: string;

    @IsOptional()
    @IsNumber()
    github_repo_id?: number;
}
