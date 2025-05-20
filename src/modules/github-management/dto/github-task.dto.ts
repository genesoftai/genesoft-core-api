import { IsNotEmpty, IsOptional } from "class-validator";

import { IsString } from "class-validator";

export class StartGithubTaskDto {
    @IsString()
    @IsNotEmpty()
    repositoryId: string;

    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsOptional()
    message?: string;

    @IsString()
    @IsOptional()
    branchName?: string;
}
