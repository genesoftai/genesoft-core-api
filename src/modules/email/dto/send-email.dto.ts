import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class SendEmailDto {
    @IsString()
    @IsNotEmpty()
    from: string;

    @IsArray()
    @IsNotEmpty()
    to: string[];

    @IsString()
    @IsNotEmpty()
    subject: string;

    @IsString()
    @IsNotEmpty()
    html: string;

    @IsString()
    @IsOptional()
    topic?: string;
}

export class SaveEmailDto {
    @IsString()
    @IsOptional()
    topic?: string;

    @IsArray()
    @IsNotEmpty()
    emails: string[];

    @IsString()
    @IsNotEmpty()
    resendId: string;
}
