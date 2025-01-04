import { IsString, IsNotEmpty, IsOptional } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"

export class UpdateRepositoryContentDto {
    @ApiProperty({
        description: "repository name",
    })
    @IsString()
    @IsNotEmpty()
    repository: string

    @ApiProperty({
        description: "path of content in repository",
    })
    @IsString()
    @IsNotEmpty()
    path: string

    @ApiProperty({
        description: "The commit message.",
    })
    @IsString()
    @IsNotEmpty()
    message: string

    @ApiProperty({
        description: "The new file content, using Base64 encoding.",
    })
    @IsString()
    @IsNotEmpty()
    content: string

    @ApiProperty({
        description:
            "Required if you are updating a file. The blob SHA of the file being replaced.",
    })
    @IsString()
    @IsOptional()
    sha?: string

    @ApiProperty({
        description:
            "The branch name. Default: the repository's default branch.",
    })
    @IsString()
    @IsOptional()
    branch?: string

    @ApiProperty({
        description:
            "The person that committed the file. Default: the authenticated user.",
    })
    @IsString()
    @IsOptional()
    committer?: object

    @ApiProperty({
        description:
            "The author of the file. Default: The committer or the authenticated user if you omit committer.",
    })
    @IsString()
    @IsOptional()
    author?: object
}

export class MergeGithubBrachDto {
    @ApiProperty({
        description:
            "The name of the repository without the .git extension. The name is not case sensitive.",
    })
    @IsString()
    @IsOptional()
    repo: string

    @ApiProperty({
        description:
            "The name of the base branch that the head will be merged into.",
    })
    @IsString()
    @IsOptional()
    base: string

    @ApiProperty({
        description:
            "The branch name. Default: the repository's default branch.",
    })
    @IsString()
    @IsNotEmpty()
    head: string

    @ApiProperty({
        description: "commitMessage",
    })
    @IsString()
    @IsOptional()
    commitMessage: string
}
