import { IsString, IsEnum, IsNotEmpty, IsNumber } from "class-validator";
import { ProjectTemplateName } from "@/modules/constants/project";

export class CheckRepositoryBuildDto {
    @IsString()
    @IsNotEmpty()
    project_id: string;

    @IsEnum(ProjectTemplateName)
    @IsNotEmpty()
    template: ProjectTemplateName;

    @IsString()
    @IsNotEmpty()
    iteration_id: string;
}

export class CheckRepositoryBuildOverviewDto {
    @IsString()
    @IsNotEmpty()
    project_id: string;
}

export class CheckFrontendRepositoryBuildDto {
    @IsString()
    @IsNotEmpty()
    project_id: string;

    @IsString()
    @IsNotEmpty()
    iteration_id: string;
}

export class CheckBackendRepositoryBuildDto {
    @IsString()
    @IsNotEmpty()
    project_id: string;

    @IsString()
    @IsNotEmpty()
    iteration_id: string;
}

export class TriggerBackendBuilderAgentDto {
    @IsString()
    @IsNotEmpty()
    project_id: string;

    @IsString()
    @IsNotEmpty()
    iteration_id: string;

    @IsString()
    @IsNotEmpty()
    backend_repo_name: string;

    @IsNumber()
    @IsNotEmpty()
    attempts: number;
}

export class TriggerFrontendBuilderAgentDto {
    @IsString()
    @IsNotEmpty()
    project_id: string;

    @IsString()
    @IsNotEmpty()
    iteration_id: string;

    @IsString()
    @IsNotEmpty()
    frontend_repo_name: string;

    @IsNumber()
    @IsNotEmpty()
    attempts: number;
}
