import { IsNotEmpty, IsString } from "class-validator";

export class CreatePRDto {
    @IsString()
    @IsNotEmpty()
    repositoryId: string;

    @IsString()
    @IsNotEmpty()
    branchId: string;
}
