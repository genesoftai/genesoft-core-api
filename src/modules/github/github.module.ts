import { Logger, Module } from "@nestjs/common";
import { GithubController } from "./github.controller";
import { GithubService } from "./github.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GithubRepository } from "./entity/github-repository.entity";
import { OrganizationModule } from "../organization/organization.module";

import { HttpModule } from "@nestjs/axios";
import { Project } from "../project/entity/project.entity";
import { GithubConfigurationModule } from "../configuration/github/github.module";
import { AppConfigurationModule } from "../configuration/app/app.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([GithubRepository, Project]),
        OrganizationModule,
        HttpModule,
        GithubConfigurationModule,
        AppConfigurationModule,
    ],
    controllers: [GithubController],
    providers: [Logger, GithubService],
    exports: [GithubService],
})
export class GithubModule {}
