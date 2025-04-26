import { IsNotEmpty, IsOptional } from "class-validator";

import { IsString } from "class-validator";

export class UpdateFileDto {
    @IsString()
    @IsNotEmpty()
    path: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsString()
    @IsOptional()
    projectId?: string;

    @IsString()
    @IsOptional()
    message?: string;
}
