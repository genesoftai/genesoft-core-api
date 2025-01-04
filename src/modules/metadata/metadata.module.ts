import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MetadataController } from "./metadata.controller";
import { MetadataService } from "./metadata.service";
import { File } from "./entity/file.entity";
import { ReferenceLink } from "./entity/reference-link.entity";
import { AWSConfigurationModule } from "../configuration/aws";
import { AuthModule } from "../auth/auth.module";
import { AwsModule } from "../aws/aws.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([File, ReferenceLink]),
        AwsModule,
        AWSConfigurationModule,
        AuthModule,
    ],
    controllers: [MetadataController],
    providers: [MetadataService],
    exports: [MetadataService],
})
export class MetadataModule {}
