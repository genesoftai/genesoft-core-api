import { Module } from "@nestjs/common";
import { AiAgentConfigurationService } from "./ai-agent.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import configuration from "./configuration";

@Module({
    imports: [ConfigModule.forRoot({ load: [configuration] })],
    providers: [ConfigService, AiAgentConfigurationService],
    exports: [ConfigService, AiAgentConfigurationService],
})
export class AiAgentConfigurationModule {}
