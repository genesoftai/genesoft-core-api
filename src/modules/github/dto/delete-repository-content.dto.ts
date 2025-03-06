import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsObject } from "class-validator";

export class DeleteFileContentFromRepositoryDto {
    @ApiProperty({
        description: "repository name",
    })
    @IsString()
    @IsNotEmpty()
    repository: string;

    @ApiProperty({
        description: "path of content in repository",
    })
    @IsString()
    @IsNotEmpty()
    path: string;

    @ApiProperty({
        description: "The commit message.",
    })
    @IsString()
    @IsNotEmpty()
    message: string;

    @ApiProperty({
        description:
            "The branch name. Default: the repository's default branch.",
    })
    @IsString()
    @IsNotEmpty()
    branch: string;

    @ApiProperty({
        description:
            "The person that committed the file. Default: the authenticated user.",
    })
    @IsObject()
    @IsNotEmpty()
    committer: object;
}
