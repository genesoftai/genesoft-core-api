import { IsNotEmpty, IsString } from "class-validator";

export class CreateNewVercelProjectDto {
    @IsString()
    @IsNotEmpty()
    project_id: string;
}

export class CreateNewVercelProjectRecordDto {
    @IsString()
    @IsNotEmpty()
    project_id: string;

    @IsString()
    @IsNotEmpty()
    vercel_project_id: string;

    @IsString()
    @IsNotEmpty()
    vercel_project_name: string;
}
