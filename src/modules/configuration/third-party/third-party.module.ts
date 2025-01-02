import { Module } from "@nestjs/common";
import { ThirdPartyConfigurationService } from "./third-party.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import configuration from "./configuration";

@Module({
    imports: [ConfigModule.forRoot({ load: [configuration] })],
    providers: [ConfigService, ThirdPartyConfigurationService],
    exports: [ConfigService, ThirdPartyConfigurationService],
})
export class ThirdPartyConfigurationModule {}
