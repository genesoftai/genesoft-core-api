import {
    IsString,
    IsOptional,
    IsNumber,
    IsObject,
    IsArray,
    IsNotEmpty,
} from "class-validator";

export class CreateIterationTaskDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsNotEmpty()
    team: string;

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

export class IterationTaskDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    team: string;

    @IsString()
    @IsOptional()
    description?: string;
}

export class CreateIterationTasksDto {
    @IsArray()
    @IsNotEmpty()
    tasks: Array<IterationTaskDto>;
}
