import { Module } from "@nestjs/common";
import { VercelConfigurationService } from "./vercel.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import configuration from "./configuration";

@Module({
    imports: [ConfigModule.forRoot({ load: [configuration] })],
    providers: [ConfigService, VercelConfigurationService],
    exports: [ConfigService, VercelConfigurationService],
})
export class VercelConfigurationModule {}
