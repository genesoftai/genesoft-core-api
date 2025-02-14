import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AWSConfigurationService {
    constructor(private configService: ConfigService) {}

    get awsAccessKey() {
        return this.configService.get("aws.awsAccessKey");
    }

    get awsSecretKey() {
        return this.configService.get("aws.awsSecretKey");
    }

    get awsS3BucketName() {
        return this.configService.get("aws.awsS3BucketName");
    }

    get awsRegion() {
        return this.configService.get("aws.awsRegion");
    }

    get awsS3CustomerBucketName() {
        return this.configService.get("aws.awsS3CustomerBucketName");
    }
}
