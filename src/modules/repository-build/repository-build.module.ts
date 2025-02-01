import { Module } from "@nestjs/common";
import { RepositoryBuildService } from "./repository-build.service";
import { RepositoryBuildController } from "./repository-build.controller";
import { GithubModule } from "@/modules/github/github.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GithubRepository } from "@/modules/github/entity/github-repository.entity";
import { FrontendInfraModule } from "@/frontend-infra/frontend-infra.module";
import { RepositoryBuild } from "./entity/repository-build.entity";
import { HttpModule } from "@nestjs/axios";
import { AiAgentConfigurationModule } from "@/modules/configuration/ai-agent/ai-agent.module";

@Module({
    imports: [
        GithubModule,
        TypeOrmModule.forFeature([GithubRepository, RepositoryBuild]),
        FrontendInfraModule,
        HttpModule,
        AiAgentConfigurationModule,
    ],
    providers: [RepositoryBuildService],
    controllers: [RepositoryBuildController],
})
export class RepositoryBuildModule {}
