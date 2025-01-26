import {
    IsString,
    IsOptional,
    IsNumber,
    IsObject,
    IsNotEmpty,
} from "class-validator";

export class UpdateIterationTaskDto {
    @IsString()
    @IsOptional()
    iteration_id?: string;

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

export class UpdateIterationTaskStatusDto {
    @IsString()
    @IsNotEmpty()
    status: string;
}

export class UpdateIterationTaskResultDto {
    @IsObject()
    @IsNotEmpty()
    result?: object;
}
