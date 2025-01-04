import { ApiProperty } from "@nestjs/swagger"
import { IsString, IsNotEmpty, IsOptional } from "class-validator"

export class GetRepositoryContentDto {
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
        description:
            "The name of the commit/branch/tag. Default: the repository's default branch.",
    })
    @IsString()
    @IsOptional()
    ref?: string
}
