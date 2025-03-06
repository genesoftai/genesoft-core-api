import { FileInterceptor } from "@nestjs/platform-express";
import { SaveReferenceLinkDto, UploadFileDto } from "./dto/save-metadata";
import {
    Body,
    Controller,
    Param,
    Post,
    UploadedFile,
    UseInterceptors,
    UseGuards,
} from "@nestjs/common";
import { MetadataService } from "./metadata.service";
import { v4 as uuidv4 } from "uuid";
import { AwsS3Service } from "../aws/aws-s3.service";
import { AWSConfigurationService } from "../configuration/aws";
import { getS3FileUrl } from "@/utils/aws/s3";
import { AuthGuard } from "../auth/auth.guard";

@Controller("metadata")
@UseGuards(AuthGuard)
export class MetadataController {
    constructor(
        private readonly metadataService: MetadataService,
        private readonly awsS3Service: AwsS3Service,
        private readonly awsConfigurationService: AWSConfigurationService,
    ) {}

    @Post("/reference-link")
    async uploadReferenceLink(@Body() payload: SaveReferenceLinkDto) {
        return this.metadataService.saveReferenceLink(payload);
    }

    @Post("/file/:organization_id")
    @UseInterceptors(FileInterceptor("file"))
    async uploadFileToS3(
        @UploadedFile()
        file: Express.Multer.File,
        @Param("organization_id") organizationId: string,
        @Body() payload: UploadFileDto,
    ) {
        const fileRefId = uuidv4();
        const fileKey = `${organizationId}/${payload.file_type}/${fileRefId}`;
        await this.awsS3Service.uploadFileToS3Bucket({
            bucketName: this.awsConfigurationService.awsS3BucketName,
            key: fileKey,
            body: file.buffer,
            contentType: file.mimetype,
        });

        const fileRecord = await this.metadataService.saveFile({
            name: payload.name,
            description: payload.description,
            type: file.mimetype,
            bucket: this.awsConfigurationService.awsS3BucketName,
            path: fileKey,
        });

        return {
            ...fileRecord,
            url: getS3FileUrl(
                this.awsConfigurationService.awsS3BucketName,
                this.awsConfigurationService.awsRegion,
                fileRecord.path,
            ),
        };
    }

    @Post("/file/:folder_name")
    @UseInterceptors(FileInterceptor("file"))
    async uploadFileToS3AsCommonFile(
        @UploadedFile()
        file: Express.Multer.File,
        @Body() payload: UploadFileDto,
        @Param("folder_name") folderName: string,
    ) {
        const fileRefId = uuidv4();
        const fileKey = `${folderName}/${payload.file_type}/${fileRefId}`;
        await this.awsS3Service.uploadFileToS3Bucket({
            bucketName: this.awsConfigurationService.awsS3BucketName,
            key: fileKey,
            body: file.buffer,
            contentType: file.mimetype,
        });

        const fileRecord = await this.metadataService.saveFile({
            name: payload.name,
            description: payload.description,
            type: file.mimetype,
            bucket: this.awsConfigurationService.awsS3BucketName,
            path: fileKey,
        });

        return {
            ...fileRecord,
            url: getS3FileUrl(
                this.awsConfigurationService.awsS3BucketName,
                this.awsConfigurationService.awsRegion,
                fileRecord.path,
            ),
        };
    }
}
