import { Type } from "class-transformer";
import {
    IsArray,
    IsNotEmpty,
    IsObject,
    IsString,
    ValidateNested,
} from "class-validator";

export class EnvironmentVariableDto {
    @IsString()
    @IsNotEmpty()
    key: string;

    @IsString()
    @IsNotEmpty()
    value: string;

    @IsString()
    @IsNotEmpty()
    type?: string = "plain";

    @IsArray()
    @IsNotEmpty()
    target?: string[] = ["production"];

    @IsString()
    @IsNotEmpty()
    gitBranch: string = "main";
}

export class AddEnvironmentVariablesToVercelProjectDto {
    @IsString()
    @IsNotEmpty()
    project_id: string;

    @IsArray()
    @ValidateNested()
    @Type(() => EnvironmentVariableDto)
    environment_variables: EnvironmentVariableDto[];
}

export class AddOneEnvironmentVariableToVercelProjectDto {
    @IsString()
    @IsNotEmpty()
    project_id: string;

    @IsObject()
    @IsNotEmpty()
    environment_variable: EnvironmentVariableDto;
}
