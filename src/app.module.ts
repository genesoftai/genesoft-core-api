import { Logger, Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import * as winston from "winston";
import { OrganizationModule } from "./modules/organization/organization.module";
import { UserModule } from "./modules/user/user.module";
import { ProjectModule } from "./modules/project/project.module";
import {
    WinstonModule,
    utilities as nestWinstonModuleUtilities,
} from "nest-winston";
import { MetadataModule } from "./modules/metadata/metadata.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AppConfigurationModule } from "./modules/configuration/app/app.module";
import { AppConfigurationService } from "./modules/configuration/app/app.service";
import { GithubModule } from "./modules/github/github.module";
import { DevelopmentModule } from "./modules/development/development.module";
import { EmailModule } from "./modules/email/email.module";
import { RepositoryBuildModule } from "./modules/repository-build/repository-build.module";
import { FrontendInfraModule } from "./modules/frontend-infra/frontend-infra.module";
import { BackendInfraModule } from "./modules/backend-infra/backend-infra.module";
import { FeedbackModule } from "@/modules/feedback/feedback.module";
import { SupabaseModule } from "./modules/supabase/supabase.module";
import { WebApplicationModule } from "./modules/web-application/web-application.module";
import { StripeModule } from "./modules/stripe/stripe.module";
import { BusinessLogicModule } from "./business-logic/business-logic.module";
import { PageModule } from "./page/page.module";
import { FeatureModule } from "./feature/feature.module";
import { ConversationModule } from "./conversation/conversation.module";
import { SubscriptionModule } from "./modules/subscription/subscription.module";
import { CodesandboxModule } from "./modules/codesandbox/codesandbox.module";
import { FirebaseModule } from "./modules/firebase/firebase.module";
import { IntegrationModule } from "./modules/integration/integration.module";
import { CollectionModule } from "./modules/collection/collection.module";

@Module({
    imports: [
        WinstonModule.forRoot({
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.ms(),
                        nestWinstonModuleUtilities.format.nestLike("MyApp", {
                            colors: true,
                            prettyPrint: true,
                        }),
                    ),
                }),
            ],
        }),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule, AppConfigurationModule],
            inject: [AppConfigurationService],
            useFactory: (appConfigurationService: AppConfigurationService) => ({
                type: "postgres",
                url: appConfigurationService.databaseUrl,
                entities: ["dist/**/*.entity{.ts,.js}"],
                synchronize: false,
            }),
        }),
        OrganizationModule,
        UserModule,
        ProjectModule,
        MetadataModule,
        AuthModule,
        GithubModule,
        DevelopmentModule,
        EmailModule,
        RepositoryBuildModule,
        FrontendInfraModule,
        BackendInfraModule,
        FeedbackModule,
        SupabaseModule,
        WebApplicationModule,
        StripeModule,
        BusinessLogicModule,
        PageModule,
        FeatureModule,
        ConversationModule,
        SubscriptionModule,
        CodesandboxModule,
        FirebaseModule,
        IntegrationModule,
        CollectionModule,
    ],
    controllers: [AppController],
    providers: [AppService, Logger],
})
export class AppModule {}
