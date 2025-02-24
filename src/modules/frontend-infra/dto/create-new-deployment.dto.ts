import { IsNotEmpty } from "class-validator";

import { IsString } from "class-validator";

export class CreateNewVercelDeploymentDto {
    @IsString()
    @IsNotEmpty()
    project_id: string;

    @IsString()
    @IsNotEmpty()
    deployment_id: string;
}
