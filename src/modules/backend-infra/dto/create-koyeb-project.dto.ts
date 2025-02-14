import { IsNotEmpty, IsString } from "class-validator";

export class CreateKoyebProjectDto {
    @IsNotEmpty()
    @IsString()
    projectId: string;
}

export class CreateKoyebServiceDto {
    @IsNotEmpty()
    @IsString()
    projectId: string;

    @IsNotEmpty()
    @IsString()
    appId: string;

    @IsNotEmpty()
    @IsString()
    apiKey: string;
}
