import {
    IsString,
    IsUUID,
    IsOptional,
    IsArray,
    ValidateNested,
    IsNotEmpty,
    IsBoolean,
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
}
