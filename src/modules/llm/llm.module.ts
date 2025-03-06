import { Module } from "@nestjs/common";
import { LlmService } from "./llm.service";
import { LlmController } from "./llm.controller";
import { ThirdPartyConfigurationModule } from "../configuration/third-party/third-party.module";

@Module({
    imports: [ThirdPartyConfigurationModule],
    providers: [LlmService],
    controllers: [LlmController],
    exports: [LlmService],
})
export class LlmModule {}
