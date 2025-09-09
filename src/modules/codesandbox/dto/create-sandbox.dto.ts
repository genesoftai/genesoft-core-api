import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateSandboxDto {
    @IsString()
    @IsOptional()
    template?: string;

    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class CreateSandboxFromGithubRepositoryDto {
    @IsString()
    githubRepository: string;
}

export class CreateSandboxFromGitDto {
    @IsString()
    @IsNotEmpty()
    repositoryId: string;

    @IsNotEmpty()
    @IsString()
    branch: string;
}
