import { IsString, IsNotEmpty, IsArray, IsOptional } from "class-validator";

export class UploadManyFilesToS3BucketDto {
    @IsNotEmpty()
    @IsString()
    bucketName: string;

    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    keys: string[];

    @IsArray()
    @IsNotEmpty({ each: true })
    filesContent: any[];
}

export class UploadFileToS3BucketDto {
    @IsNotEmpty()
    @IsString()
    bucketName: string;

    @IsNotEmpty()
    @IsString()
    key: string;

    @IsNotEmpty()
    body: any;

    @IsOptional()
    @IsString()
    contentEncoding?: string;

    @IsOptional()
    @IsString()
    contentType?: string;
}
