import { forwardRef, Logger, Module } from "@nestjs/common";
import { GithubManagementService } from "./github-management.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GithubBranch } from "./entity/github-branch.entity";
import { OrganizationModule } from "../organization/organization.module";

import { HttpModule } from "@nestjs/axios";
import { Project } from "../project/entity/project.entity";
import { GithubConfigurationModule } from "../configuration/github/github.module";
import { AppConfigurationModule } from "../configuration/app/app.module";
import { GithubRepository } from "../github/entity/github-repository.entity";
import { GithubManagementController } from "./github-management.controller";
import { CodesandboxModule } from "../codesandbox/codesandbox.module";
import { CollectionModule } from "../collection/collection.module";
import { ConversationModule } from "../conversation/conversation.module";
import { LlmModule } from "../llm/llm.module";
import { GithubModule } from "../github/github.module";
import { Iteration } from "../development/entity/iteration.entity";
import { Conversation } from "../conversation/entity/conversation.entity";
@Module({
    imports: [
        TypeOrmModule.forFeature([
            GithubRepository,
            Project,
            GithubBranch,
            Iteration,
            Conversation,
        ]),
        OrganizationModule,
        HttpModule,
        GithubConfigurationModule,
        AppConfigurationModule,
        CodesandboxModule,
        CollectionModule,
        LlmModule,
        GithubModule,
        forwardRef(() => ConversationModule),
    ],
    controllers: [GithubManagementController],
    providers: [Logger, GithubManagementService],
    exports: [GithubManagementService],
})
export class GithubManagementModule {}
