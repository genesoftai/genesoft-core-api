import { FileInterceptor } from "@nestjs/platform-express";
import { SaveReferenceLinkDto, UploadFileDto } from "./dto/save-metadata";
import {
    Body,
    Controller,
    Param,
    Post,
    UploadedFile,
    UseInterceptors,
} from "@nestjs/common";
import { MetadataService } from "./metadata.service";
import { v4 as uuidv4 } from "uuid";
import { AwsS3Service } from "../aws/aws-s3.service";
import { AWSConfigurationService } from "../configuration/aws";
import { getS3FileUrl } from "@/utils/aws/s3";

@Controller("metadata")
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
        console.log({
            message: "payload in controller of /metadata/file/:organization_id",
            payload,
        });
        const fileRefId = uuidv4();
        const fileKey = `${organizationId}/${payload.file_type}/${fileRefId}`;
        await this.awsS3Service.uploadFileToS3Bucket({
            bucketName: this.awsConfigurationService.awsS3BucketName,
            key: fileKey,
            body: file.buffer,
            contentType: file.mimetype,
        });
        // TODO: save file record
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
// https://genesoft-dev.s3.ap-southeast-1.amazonaws.com/21619673-406f-4a73-9a83-ba3dce66380c/image/png/34583bad-ada2-4ec5-8383-c41c0d906df4
// https://genesoft-dev.s3.ap-southeast-1.amazonaws.com/21619673-406f-4a73-9a83-ba3dce66380c/image/png/3d0e96e4-a886-4365-887b-168c0602ddf7
