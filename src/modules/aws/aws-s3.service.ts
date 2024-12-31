import {
    BadRequestException,
    Inject,
    Injectable,
    LoggerService,
    Logger,
} from "@nestjs/common";
import { AWSConfigurationService } from "../configuration/aws";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

@Injectable()
export class AwsS3Service {
    private readonly serviceName: string;
    private readonly s3Client: S3Client;
    constructor(
        private awsConfigurationService: AWSConfigurationService,
        @Inject(Logger) private readonly logger: LoggerService,
    ) {
        this.serviceName = AwsS3Service.name;
        this.s3Client = new S3Client({
            region: this.awsConfigurationService.awsRegion,
            credentials: {
                accessKeyId: this.awsConfigurationService.awsAccessKey,
                secretAccessKey: this.awsConfigurationService.awsSecretKey,
            },
        });
    }

    logError({
        metadata,
        functionName,
        message,
        error,
    }: {
        metadata: any;
        functionName: string;
        message: string;
        error: any;
    }) {
        this.logger.error(
            {
                message: `${this.serviceName}.${functionName}: ${message}`,
                metadata,
                stack: error?.stack,
            },
            this.serviceName,
        );
    }

    uploadManyFilesToS3Bucket = async ({
        bucketName,
        keys,
        filesContent,
    }: {
        bucketName: string;
        keys: string[];
        filesContent: any[];
    }) => {
        if (keys.length !== filesContent.length)
            throw new BadRequestException(
                "Keys and Files Contennt need to have same length",
            );

        const results = await Promise.all(
            keys.map(async (key, index) => {
                const fileContent = filesContent[index];
                return this.uploadFileToS3Bucket({
                    bucketName,
                    key,
                    body: fileContent,
                });
            }),
        );

        return results;
    };

    uploadFileToS3Bucket = async ({
        bucketName,
        key,
        body,
        contentEncoding,
        contentType,
    }: {
        bucketName: string;
        key: string;
        body: any;
        contentEncoding?: string;
        contentType?: string;
    }) => {
        try {
            this.logger.log({
                message: `${this.serviceName}.uploadFilesToBucket: Uploading file to AWS S3`,
                metadata: {
                    bucketName,
                    key,
                },
            });
            const command = { Bucket: bucketName, Body: body, Key: key };
            if (contentEncoding) {
                command["ContentEncoding"] = contentEncoding;
            }
            if (contentType) {
                command["ContentType"] = contentType;
            }

            const result = await this.s3Client.send(
                new PutObjectCommand(command),
            );

            this.logger.log({
                message: `${this.serviceName}.uploadFilesToBucket: Success on uploading file to AWS S3`,
                metadata: {
                    command,
                    bucketName,
                    key,
                    contentEncoding,
                    contentType,
                    result,
                },
            });
            return result;
        } catch (error) {
            this.logError({
                metadata: { bucketName, key },
                functionName: `uploadFileToS3Bucket`,
                message: "Error while uploading file to S3 Bucket",
                error,
            });
            throw error;
        }
    };
}
