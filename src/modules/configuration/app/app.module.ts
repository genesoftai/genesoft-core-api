import { Module } from "@nestjs/common";
import { AppConfigurationService } from "./app.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import configuration from "./configuration";

@Module({
    imports: [ConfigModule.forRoot({ load: [configuration] })],
    providers: [ConfigService, AppConfigurationService],
    exports: [ConfigService, AppConfigurationService],
})
export class AppConfigurationModule {}
