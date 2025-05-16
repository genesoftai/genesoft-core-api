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

export class RunTaskOnSandboxDto {
    @IsNotEmpty()
    @IsString()
    sandbox_id: string;

    @IsString()
    task: string;
}

export class RunDevTaskOnSandboxDto {
    @IsNotEmpty()
    @IsString()
    sandbox_id: string;
}

export class RunBuildTaskOnSandboxDto {
    @IsNotEmpty()
    @IsString()
    sandbox_id: string;
}

export class RunStartTaskOnSandboxDto {
    @IsNotEmpty()
    @IsString()
    sandbox_id: string;
}

export class KillAllShellsDto {
    @IsNotEmpty()
    @IsString()
    sandbox_id: string;
}

export class RunInstallTaskOnSandboxDto {
    @IsNotEmpty()
    @IsString()
    sandbox_id: string;
}
