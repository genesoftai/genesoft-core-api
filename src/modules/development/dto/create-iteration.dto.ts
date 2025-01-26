import { IsString, IsOptional, IsNotEmpty } from "class-validator";

export class CreateIterationDto {
    @IsString()
    @IsNotEmpty()
    project_id: string;

    @IsString()
    @IsNotEmpty()
    type: string;

    @IsString()
    @IsOptional()
    feedback_id?: string;
}
