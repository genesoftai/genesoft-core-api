import { IsString, IsUUID } from "class-validator";

import { IsNotEmpty } from "class-validator";

export class UpdateUserImageDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    image: string;
}

export class UpdateUserImageByEmailDto {
    @IsString()
    @IsNotEmpty()
    image: string;
}
