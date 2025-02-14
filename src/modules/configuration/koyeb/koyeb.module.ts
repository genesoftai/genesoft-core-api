import { Module } from "@nestjs/common";
import { KoyebConfigurationService } from "./koyeb.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import configuration from "./configuration";

@Module({
    imports: [ConfigModule.forRoot({ load: [configuration] })],
    providers: [ConfigService, KoyebConfigurationService],
    exports: [ConfigService, KoyebConfigurationService],
})
export class KoyebConfigurationModule {}
