import { IsString, IsOptional, IsNumber } from "class-validator";

export class UpdateIterationDto {
    @IsString()
    @IsOptional()
    project_id?: string;

    @IsString()
    @IsOptional()
    type?: string;

    @IsString()
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    feedback_id?: string;

    @IsNumber()
    @IsOptional()
    working_time?: number;
}
