import { IsNotEmpty } from "class-validator";
import { IsString } from "class-validator";

export class CreateFeatureDto {
    @IsString()
    @IsNotEmpty()
    project_id: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    description: string;
}
