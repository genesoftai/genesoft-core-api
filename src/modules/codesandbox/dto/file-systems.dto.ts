import { IsString } from "class-validator";
import { IsNotEmpty } from "class-validator";

export class WriteFileOnSandboxDto {
    @IsNotEmpty()
    @IsString()
    sandbox_id: string;

    @IsNotEmpty()
    @IsString()
    path: string;

    @IsString()
    @IsNotEmpty()
    content: string;
}

export class ReadFileOnSandboxDto {
    @IsNotEmpty()
    @IsString()
    sandbox_id: string;

    @IsNotEmpty()
    @IsString()
    path: string;
}

export class DeleteFileOnSandboxDto {
    @IsNotEmpty()
    @IsString()
    sandbox_id: string;

    @IsNotEmpty()
    @IsString()
    path: string;
}

export class ListFilesOnSandboxDto {
    @IsNotEmpty()
    @IsString()
    sandbox_id: string;

    @IsString()
    @IsNotEmpty()
    path: string;
}

export class UploadFileOnSandboxDto {
    @IsNotEmpty()
    @IsString()
    sandbox_id: string;

    @IsString()
    @IsNotEmpty()
    path: string;

    @IsNotEmpty()
    content: Buffer;
}

export class DownloadFileOnSandboxDto {
    @IsNotEmpty()
    @IsString()
    sandbox_id: string;

    @IsString()
    @IsNotEmpty()
    path: string;
}

export class RenameFileOnSandboxDto {
    @IsNotEmpty()
    @IsString()
    sandbox_id: string;

    @IsNotEmpty()
    @IsString()
    old_path: string;

    @IsNotEmpty()
    @IsString()
    new_path: string;
}
