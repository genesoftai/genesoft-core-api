import { IsString, IsOptional, IsNotEmpty } from "class-validator";

export class UploadFileDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsString()
    @IsNotEmpty()
    file_type: string;
}

export class SaveFileDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsString()
    @IsNotEmpty()
    type: string;

    @IsString()
    @IsNotEmpty()
    bucket: string;

    @IsString()
    @IsNotEmpty()
    path: string;
}

export class SaveReferenceLinkDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsString()
    @IsNotEmpty()
    url: string;
}
