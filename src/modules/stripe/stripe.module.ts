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

@Module({
    imports: [
        StripeConfigurationModule,
        TypeOrmModule.forFeature([User]),
        SubscriptionModule,
    ],
    controllers: [StripeController],
    providers: [
        StripeService,
        StripeConfigurationService,
        Logger,
        StripeWebhookService,
    ],
})
export class StripeModule {}
