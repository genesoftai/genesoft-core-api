import { ApiProperty } from "@nestjs/swagger"
import { IsString, IsOptional, IsNotEmpty } from "class-validator"

export class GetGithubRepositoryFromGithubDto {
    @ApiProperty({
        description: "repository name on Genesoft's Github Organization",
    })
    @IsString()
    @IsOptional()
    repositoryName: string
}

export class GetRepositoryTreesQuery {
    @ApiProperty({
        description: "repository name",
    })
    @IsString()
    @IsNotEmpty()
    repository: string

    @ApiProperty({
        description: "branch name",
    })
    @IsString()
    @IsNotEmpty()
    branch: string
}

export class GetAllRepositoryEnvQuery {
    @ApiProperty({
        description: "repository name",
    })
    @IsString()
    @IsNotEmpty()
    repository: string

    @ApiProperty({
        description: "branch name",
    })
    @IsString()
    @IsNotEmpty()
    branch: string
}
