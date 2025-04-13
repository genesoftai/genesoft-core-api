import {
    IsArray,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
} from "class-validator";

export class CreateCollectionDto {
    @IsNotEmpty()
    @IsUUID()
    organization_id: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsUUID()
    web_project_id?: string;

    @IsOptional()
    @IsArray()
    @IsUUID(undefined, { each: true })
    backend_service_project_ids?: string[];
}
