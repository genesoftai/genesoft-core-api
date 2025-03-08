import { IsNotEmpty, IsString } from "class-validator";

export class SendContactEmailDto {
    @IsString()
    @IsNotEmpty()
    companyName: string;

    @IsString()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    reason: string;
}

export class SendSupportEmailDto {
    @IsString()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    query: string;
}
