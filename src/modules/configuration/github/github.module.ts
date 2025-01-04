import { Module } from "@nestjs/common";
import { GithubConfigurationService } from "./github.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import configuration from "./configuration";

@Module({
    imports: [ConfigModule.forRoot({ load: [configuration] })],
    providers: [ConfigService, GithubConfigurationService],
    exports: [ConfigService, GithubConfigurationService],
})
export class GithubConfigurationModule {}
