import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateGithubRepositoryUsingTemplateDto {
    @ApiProperty({
        description:
            "Project Template (nextjs,nestjs) name on to create Genesoft's Github Organization",
    })
    @IsString()
    @IsNotEmpty()
    projectTemplateName: string;

    @ApiProperty({
        description: "Project id on Project table",
    })
    @IsString()
    @IsNotEmpty()
    projectId: string;

    @ApiProperty({
        description: "Github Repository description",
    })
    @IsString()
    @IsOptional()
    description?: string;
}
