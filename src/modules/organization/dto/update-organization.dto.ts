import { OrganizationRole } from "@/modules/constants/organization";
import { IsEmail, IsOptional, IsString, IsUUID } from "class-validator";

import { IsNotEmpty } from "class-validator";

export class AddUserToOrganization {
    @IsOptional()
    @IsUUID()
    userId?: string;

    @IsNotEmpty()
    @IsUUID()
    organizationId: string;

    @IsNotEmpty()
    @IsString()
    role: OrganizationRole;

    @IsOptional()
    @IsEmail()
    email?: string;
}

export class UpdateUserRole {
    @IsOptional()
    @IsUUID()
    userId?: string;

    @IsNotEmpty()
    @IsUUID()
    organizationId: string;

    @IsNotEmpty()
    @IsString()
    role: OrganizationRole;

    @IsOptional()
    @IsEmail()
    email?: string;
}

export class RemoveUserFromOrganization {
    @IsOptional()
    @IsUUID()
    userId?: string;

    @IsNotEmpty()
    @IsUUID()
    organizationId: string;

    @IsOptional()
    @IsEmail()
    email?: string;
}
