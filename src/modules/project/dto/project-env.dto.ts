import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateProjectEnvDto {
    @IsString()
    @IsNotEmpty()
    key: string;

    @IsString()
    @IsNotEmpty()
    value: string;

    @IsBoolean()
    @IsOptional()
    isSecret?: boolean;
}

export class UpdateProjectEnvDto {
    @IsString()
    @IsOptional()
    value?: string;

    @IsBoolean()
    @IsOptional()
    isSecret?: boolean;
}

export class ProjectEnvResponseDto {
    id: string;
    key: string;
    value: string;
    isSecret: boolean;
    createdAt: Date;
    updatedAt: Date;
}
