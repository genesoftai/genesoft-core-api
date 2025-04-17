import { Logger, Module } from "@nestjs/common";
import { StripeController } from "./stripe.controller";
import { StripeService } from "./stripe.service";
import {
    StripeConfigurationModule,
    StripeConfigurationService,
} from "../configuration/stripe";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../user/entity/user.entity";
import { SubscriptionModule } from "../subscription/subscription.module";
import { StripeWebhookService } from "./stripe-webhook.service";
import { BackendInfraModule } from "@modules/backend-infra/backend-infra.module";
import { AppConfigurationModule } from "@modules/configuration/app/app.module";
import { ProjectDbModule } from "@modules/project-db/project-db.module";
@Module({
    imports: [
        StripeConfigurationModule,
        TypeOrmModule.forFeature([User]),
        SubscriptionModule,
        BackendInfraModule,
        AppConfigurationModule,
        ProjectDbModule,
    ],
    controllers: [StripeController],
    providers: [
        StripeService,
        StripeConfigurationService,
        Logger,
        StripeWebhookService,
    ],
    exports: [StripeService],
})
export class StripeModule {}
