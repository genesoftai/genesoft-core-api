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
import { EmailModule } from "../email/email.module";
import { Iteration } from "../development/entity/iteration.entity";
import { Project } from "../project/entity/project.entity";
import { User } from "../user/entity/user.entity";
import { Organization } from "../organization/entity/organization.entity";
import { AppConfigurationModule } from "../configuration/app/app.module";

@Module({
    imports: [
        GithubModule,
        TypeOrmModule.forFeature([
            GithubRepository,
            RepositoryBuild,
            Iteration,
            Project,
            User,
            Organization,
        ]),
        FrontendInfraModule,
        HttpModule,
        AiAgentConfigurationModule,
        EmailModule,
        AppConfigurationModule,
    ],
    providers: [RepositoryBuildService],
    controllers: [RepositoryBuildController],
    exports: [RepositoryBuildService],
})
export class RepositoryBuildModule {}
