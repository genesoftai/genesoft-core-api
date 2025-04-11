import { Module } from "@nestjs/common";
import { LlmService } from "./llm.service";
import { LlmController } from "./llm.controller";
import { ThirdPartyConfigurationModule } from "../configuration/third-party/third-party.module";
import { GithubModule } from "../github/github.module";
import { HttpModule } from "@nestjs/axios";

@Module({
    imports: [ThirdPartyConfigurationModule, GithubModule, HttpModule],
    providers: [LlmService],
    controllers: [LlmController],
    exports: [LlmService],
})
export class LlmModule {}
