import { Logger, Module } from "@nestjs/common";
import { AWSConfigurationModule } from "../configuration/aws";
import { AwsS3Service } from "./aws-s3.service";

@Module({
    imports: [AWSConfigurationModule],
    controllers: [],
    providers: [Logger, AwsS3Service],
    exports: [AwsS3Service],
})
export class AwsModule {}
