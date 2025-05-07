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
import { ConversationModule } from "@/modules/conversation/conversation.module";
import { Conversation } from "@/modules/conversation/entity/conversation.entity";
import { CodesandboxModule } from "../codesandbox/codesandbox.module";
import { LlmModule } from "../llm/llm.module";
import { ConfigModule } from "@nestjs/config";
import { ProjectEnv } from "../project-env/entity/project-env.entity";
import { ProjectEnvController } from "./project-env.controller";
import { Collection } from "../collection/entity/collection.entity";
import { CollectionModule } from "../collection/collection.module";
import { ProjectEnvModule } from "@modules/project-env/project-env.module";
import { StripeModule } from "@modules/stripe/stripe.module";
import { ProjectSubscribeController } from "./project-subscribe.controller";
import { SubscriptionModule } from "@modules/subscription/subscription.module";
import { ProjectDbModule } from "../project-db/project-db.module";
import { CodebaseModule } from "../codebase/codebase.module";
import { FigmaModule } from "../figma/figma.module";
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
            ProjectEnv,
            Collection,
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
        CollectionModule,
        ProjectEnvModule,
        StripeModule,
        SubscriptionModule,
        ProjectDbModule,
        CodebaseModule,
        FigmaModule,
    ],
    providers: [ProjectService, Logger],
    controllers: [
        ProjectController,
        ProjectEnvController,
        ProjectSubscribeController,
    ],
    exports: [ProjectService, CollectionModule],
})
export class ProjectModule {}
