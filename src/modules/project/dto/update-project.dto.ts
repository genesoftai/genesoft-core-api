import {
    IsString,
    IsOptional,
    IsArray,
    ValidateNested,
    IsNotEmpty,
} from "class-validator";
import { Type } from "class-transformer";

export class BrandingDto {
    @IsNotEmpty()
    @IsString()
    logo_url?: string;

    @IsNotEmpty()
    @IsString()
    color?: string;

    @IsNotEmpty()
    @IsString()
    theme?: string;

    @IsNotEmpty()
    @IsString()
    perception?: string;
}

export class PageDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsArray()
    file_ids?: string[];

    @IsOptional()
    @IsArray()
    reference_link_ids?: string[];
}

export class FeatureDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsArray()
    file_ids?: string[];

    @IsOptional()
    @IsArray()
    reference_link_ids?: string[];
}

export class UpdateProjectDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

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
}

export class UpdateProjectInfoDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    purpose?: string;

    @IsOptional()
    @IsString()
    target_audience?: string;
}

export class UpdatePagesDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PageDto)
    pages: PageDto[];
}

export class UpdateFeaturesDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FeatureDto)
    features: FeatureDto[];
}
