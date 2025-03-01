import { IsArray, IsOptional } from "class-validator";

import { IsString } from "class-validator";

import { IsNotEmpty } from "class-validator";

export class CreatePageDto {
    @IsString()
    @IsNotEmpty()
    project_id: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsArray()
    @IsOptional()
    file_ids?: string[];

    @IsArray()
    @IsOptional()
    reference_link_ids?: string[];
}
