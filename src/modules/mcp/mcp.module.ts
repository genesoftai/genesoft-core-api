import { Module } from "@nestjs/common";
import { McpService } from "./mcp.service";
import { McpController } from "./mcp.controller";
import { ThirdPartyConfigurationModule } from "../configuration/third-party/third-party.module";
import { ProjectModule } from "../project/project.module";
import { GithubConfigurationModule } from "../configuration/github/github.module";
@Module({
    imports: [
        ThirdPartyConfigurationModule,
        ProjectModule,
        GithubConfigurationModule,
    ],
    providers: [McpService],
    controllers: [McpController],
    exports: [McpService],
})
export class McpModule {}
