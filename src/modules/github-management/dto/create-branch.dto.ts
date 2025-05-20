import { IsNotEmpty, IsOptional } from "class-validator";

import { IsString } from "class-validator";

export class CreateBranchDto {
    @IsString()
    @IsNotEmpty()
    repositoryId: string;

    @IsString()
    @IsNotEmpty()
    branchName: string;

    @IsString()
    @IsOptional()
    baseBranch?: string;
}
