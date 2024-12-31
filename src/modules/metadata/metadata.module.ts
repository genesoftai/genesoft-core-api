import { ReferenceLink } from "./entity/reference-link.entity";
import { Module } from "@nestjs/common";
import { MetadataService } from "./metadata.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MetadataController } from "./metadata.controller";
import { File } from "./entity/file.entity";
import { AwsModule } from "../aws/aws.module";
import { AWSConfigurationModule } from "../configuration/aws";

@Module({
    imports: [
        TypeOrmModule.forFeature([File, ReferenceLink]),
        AwsModule,
        AWSConfigurationModule,
    ],
    providers: [MetadataService],
    controllers: [MetadataController],
})
export class MetadataModule {}
