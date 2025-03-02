import { IterationStatus } from "@/modules/constants/development";
import { IsString, IsOptional, IsNumber, IsNotEmpty } from "class-validator";

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

export class UpdateIterationStatusDto {
    @IsString()
    @IsNotEmpty()
    status: IterationStatus;
}
