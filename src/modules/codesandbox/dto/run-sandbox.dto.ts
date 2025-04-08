import { IsNotEmpty, IsString } from "class-validator";

export class RunCommandOnSandboxDto {
    @IsNotEmpty()
    @IsString()
    sandbox_id: string;

    @IsString()
    @IsNotEmpty()
    command: string;
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

export class RunPreviewTaskOnSandboxDto {
    @IsNotEmpty()
    @IsString()
    sandbox_id: string;
}

export class KillAllShellsDto {
    @IsNotEmpty()
    @IsString()
    sandbox_id: string;
}
