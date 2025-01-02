import {
    IsString,
    IsUUID,
    IsOptional,
    IsArray,
    ValidateNested,
    IsNotEmpty,
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

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsNotEmpty()
    @IsString()
    purpose: string;

    @IsNotEmpty()
    @IsString()
    target_audience: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => BrandingDto)
    branding: BrandingDto;

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => PageDto)
    pages: PageDto[];

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => FeatureDto)
    features: FeatureDto[];
}
