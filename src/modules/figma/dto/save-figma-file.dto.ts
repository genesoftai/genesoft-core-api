import { IsString } from "class-validator";

import { IsNotEmpty } from "class-validator";

export class SaveFigmaFileDto {
    @IsString()
    @IsNotEmpty()
    fileKey: string;

    @IsString()
    @IsNotEmpty()
    projectId: string;
}

export class UpdateFigmaFileForProjectDto {
    @IsString()
    @IsNotEmpty()
    fileUrl: string;

    @IsString()
    @IsNotEmpty()
    fileKey: string;

    @IsString()
    @IsNotEmpty()
    projectId: string;
}
