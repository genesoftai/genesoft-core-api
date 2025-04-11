import { forwardRef, Logger, Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ProjectService } from "./project.service";
import { ProjectController } from "./project.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Project } from "./entity/project.entity";
import { Branding } from "./entity/branding.entity";
import { Page } from "./entity/page.entity";
import { Feature } from "./entity/feature.entity";
import { WebApplication } from "./entity/web-application.entity";
import { GithubRepository } from "@modules/github/entity/github-repository.entity";
import { Feedback } from "../feedback/entity/feedback.entity";
import { ReferenceLink } from "../metadata/entity/reference-link.entity";
import { File } from "../metadata/entity/file.entity";
import { AWSConfigurationModule } from "../configuration/aws";
import { AuthModule } from "../auth/auth.module";
import { GithubModule } from "../github/github.module";
import { Iteration } from "../development/entity/iteration.entity";
import { SupabaseModule } from "../supabase/supabase.module";
import { FrontendInfraModule } from "@/modules/frontend-infra/frontend-infra.module";
import { BackendInfraModule } from "@/modules/backend-infra/backend-infra.module";
import { KoyebProject } from "@/modules/backend-infra/entity/koyeb-project.entity";
import { Supabase } from "../supabase/entity/supabase.entity";
import { VercelProject } from "@/modules/frontend-infra/entity/vercel-project.entity";
import { DevelopmentModule } from "../development/development.module";
import { UserModule } from "../user/user.module";
import { OrganizationModule } from "../organization/organization.module";
import { ConversationModule } from "@/conversation/conversation.module";
import { Conversation } from "@/conversation/entity/conversation.entity";
import { CodesandboxModule } from "../codesandbox/codesandbox.module";
import { LlmModule } from "../llm/llm.module";
import { ProjectDbManagerService } from "./project-db-manager.service";
import { ProjectDb } from "./entity/project-db.entity";
import { ConfigModule } from "@nestjs/config";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Project,
            Branding,
            Page,
            Feature,
            WebApplication,
            GithubRepository,
            Feedback,
            File,
            ReferenceLink,
            Iteration,
            Supabase,
            VercelProject,
            KoyebProject,
            Conversation,
            ProjectDb,
        ]),
        AWSConfigurationModule,
        AuthModule,
        GithubModule,
        SupabaseModule,
        FrontendInfraModule,
        BackendInfraModule,
        UserModule,
        forwardRef(() => DevelopmentModule),
        forwardRef(() => OrganizationModule),
        forwardRef(() => ConversationModule),
        CodesandboxModule,
        LlmModule,
        HttpModule,
        ConfigModule,
    ],
    providers: [ProjectService, Logger, ProjectDbManagerService],
    controllers: [ProjectController],
    exports: [ProjectService, ProjectDbManagerService],
})
export class ProjectModule {}
