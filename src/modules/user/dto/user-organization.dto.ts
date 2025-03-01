import { IsUUID } from "class-validator";

import { IsNotEmpty } from "class-validator";

export class UpdateUserOrganizationDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @IsUUID()
    @IsNotEmpty()
    organizationId: string;
}
