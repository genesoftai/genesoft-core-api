import { IsString, IsArray } from "class-validator";

export class GetProjectsDto {
    @IsArray()
    @IsString({ each: true })
    ids: string[];
}
