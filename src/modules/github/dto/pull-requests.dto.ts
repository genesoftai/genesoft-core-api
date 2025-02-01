import { IsString, IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreatePullRequestDto {
    @ApiProperty({
        description:
            "The repository name where the pull request will be created.",
    })
    @IsString()
    @IsNotEmpty()
    repository: string;

    @ApiProperty({
        description:
            "The title of the new pull request. Required unless issue is specified.",
    })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({
        description:
            "The name of the branch where your changes are implemented. For cross-repository pull requests in the same network, namespace head with a user like this: username:branch.",
    })
    @IsString()
    @IsNotEmpty()
    head: string;

    @ApiProperty({
        description:
            "The name of the branch you want the changes pulled into. This should be an existing branch on the current repository.",
    })
    @IsString()
    @IsNotEmpty()
    base: string;
}

export class MergePullRequestDto {
    @ApiProperty({
        description:
            "The repository name where the pull request will be created.",
    })
    @IsString()
    @IsNotEmpty()
    repository: string;

    @ApiProperty({
        description: "The pull request number to merge.",
    })
    @IsNumber()
    @IsNotEmpty()
    pull_number: number;

    @ApiProperty({
        description: "The commit title to use.",
    })
    @IsString()
    @IsOptional()
    commit_title?: string;

    @ApiProperty({
        description: "The commit message to use.",
    })
    @IsString()
    @IsOptional()
    commit_message?: string;

    @ApiProperty({
        description: "The merge method to use.",
    })
    @IsString()
    @IsOptional()
    merge_method?: string;
}
