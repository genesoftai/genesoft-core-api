import { Module } from "@nestjs/common";
import { AWSConfigurationService } from "./aws.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import configuration from "./configuration";

@Module({
    imports: [ConfigModule.forRoot({ load: [configuration] })],
    providers: [ConfigService, AWSConfigurationService],
    exports: [ConfigService, AWSConfigurationService],
})
export class AWSConfigurationModule {}
