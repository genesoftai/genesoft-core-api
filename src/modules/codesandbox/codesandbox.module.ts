import { Module } from "@nestjs/common";
import { CodesandboxService } from "./codesandbox.service";
import { CodesandboxController } from "./codesandbox.controller";
import { ThirdPartyConfigurationModule } from "../configuration/third-party";
import { HttpModule } from "@nestjs/axios";
@Module({
    imports: [ThirdPartyConfigurationModule, HttpModule],
    providers: [CodesandboxService],
    controllers: [CodesandboxController],
    exports: [CodesandboxService],
})
export class CodesandboxModule {}
