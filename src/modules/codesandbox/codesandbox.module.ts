import { Module } from "@nestjs/common";
import { CodesandboxService } from "./codesandbox.service";
import { CodesandboxController } from "./codesandbox.controller";
import { ThirdPartyConfigurationModule } from "../configuration/third-party";
import { HttpModule } from "@nestjs/axios";
import { GithubModule } from "../github/github.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GithubRepository } from "../github/entity/github-repository.entity";

@Module({
    imports: [
        ThirdPartyConfigurationModule,
        HttpModule,
        GithubModule,
        TypeOrmModule.forFeature([GithubRepository]),
    ],
    providers: [CodesandboxService],
    controllers: [CodesandboxController],
    exports: [CodesandboxService],
})
export class CodesandboxModule {}
