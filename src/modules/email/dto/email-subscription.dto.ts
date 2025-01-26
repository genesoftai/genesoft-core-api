import { IsNotEmpty, IsString } from "class-validator";

export class SubscribeEmailDto {
    @IsString()
    @IsNotEmpty()
    email: string;
}
