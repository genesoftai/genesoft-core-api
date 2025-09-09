import { IsArray, IsNotEmpty, IsString } from "class-validator";

export class RunCommandOnSandboxDto {
    @IsNotEmpty()
    @IsString()
    sandbox_id: string;

    @IsString()
    @IsNotEmpty()
    command: string;
}

export class RunCommandToGetLogsOnSandboxDto {
    @IsString()
    @IsNotEmpty()
    sandbox_id: string;

    @IsString()
    @IsNotEmpty()
    command: string;

    @IsArray()
    @IsNotEmpty()
    end_of_logs_keywords: string[];
}

export class KillAllTerminalsDto {
    @IsNotEmpty()
    @IsString()
    sandbox_id: string;
}
