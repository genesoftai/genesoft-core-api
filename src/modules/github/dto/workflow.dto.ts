import { IsString, IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class GetWorkflowsDto {
    @ApiProperty({
        description:
            "The repository name where the pull request will be created.",
    })
    @IsString()
    @IsNotEmpty()
    repository: string;
}

export class GetWorkflowRunsDto {
    @ApiProperty({
        description:
            "The repository name where the pull request will be created.",
    })
    @IsString()
    @IsNotEmpty()
    repository: string;

    @ApiProperty({
        description: "The branch name.",
    })
    @IsString()
    @IsNotEmpty()
    branch: string;
}

export class GetLatestWorkflowRunDto {
    @ApiProperty({
        description: "The project id.",
    })
    @IsString()
    @IsNotEmpty()
    project_id: string;

    @ApiProperty({
        description: "The branch name.",
    })
    @IsString()
    @IsNotEmpty()
    branch: string;
}

export class GetWorkflowRunLogsDto {
    @ApiProperty({
        description: "The repository name.",
    })
    @IsString()
    @IsNotEmpty()
    repository: string;

    @ApiProperty({
        description: "The run id.",
    })
    @IsString()
    @IsNotEmpty()
    run_id: string;
}

export class GetWorkflowRunFailureLogsDto {
    @ApiProperty({
        description: "The repository name.",
    })
    @IsString()
    @IsNotEmpty()
    repository: string;

    @ApiProperty({
        description: "The run id.",
    })
    @IsString()
    @IsNotEmpty()
    run_id: string;

    @ApiProperty({
        description: "The failed step.",
    })
    @IsNumber()
    @IsOptional()
    failed_step: number;
}

export class GetJobOfWorkflowRunDto {
    @ApiProperty({
        description: "The repository name.",
    })
    @IsString()
    @IsNotEmpty()
    repository: string;

    @ApiProperty({
        description: "The job id.",
    })
    @IsString()
    @IsNotEmpty()
    job_id: string;
}
