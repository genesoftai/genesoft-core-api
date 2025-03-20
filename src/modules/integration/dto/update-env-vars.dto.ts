import { IsArray, IsObject, IsOptional, IsString } from "class-validator";

import { IsNotEmpty } from "class-validator";

export class UpdateEnvironmentVariablesDto {
    @IsString()
    @IsNotEmpty()
    project_id: string;

    @IsNotEmpty()
    @IsString()
    branch: string;

    @IsObject()
    @IsNotEmpty()
    env_vars: Record<string, string>;

    @IsArray()
    @IsNotEmpty()
    target: string[];

    @IsObject()
    @IsOptional()
    env_vars_comment?: Record<string, string>;
}
