import { IsString, IsOptional, IsNumber, IsObject } from "class-validator";

export class UpdateTeamTaskDto {
    @IsString()
    @IsOptional()
    iteration_task_id?: string;

    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    team?: string;

    @IsString()
    @IsOptional()
    status?: string;

    @IsString()
    @IsOptional()
    remark?: string;

    @IsNumber()
    @IsOptional()
    working_time?: number;

    @IsObject()
    @IsOptional()
    tool_usage?: Record<string, any>;

    @IsObject()
    @IsOptional()
    llm_usage?: Record<string, any>;
}
