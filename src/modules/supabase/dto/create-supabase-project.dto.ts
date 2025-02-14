import { IsNotEmpty, IsString } from "class-validator";

export class CreateSupabaseProjectDto {
    @IsNotEmpty()
    @IsString()
    projectId: string;
}
