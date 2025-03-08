import { Logger, Module } from "@nestjs/common";
import { SubscriptionController } from "./subscription.controller";
import { SubscriptionService } from "./subscription.service";
import { StripeConfigurationModule } from "@/modules/configuration/stripe";
import { SupabaseConfigurationModule } from "@/modules/configuration/supabase";
import { UserModule } from "../user/user.module";
import { AuthModule } from "../auth/auth.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../user/entity/user.entity";
import { Subscription } from "./entity/subscription.entity";
import { Organization } from "../organization/entity/organization.entity";
@Module({
    imports: [
        TypeOrmModule.forFeature([User, Subscription, Organization]),
        StripeConfigurationModule,
        SupabaseConfigurationModule,
        UserModule,
        AuthModule,
    ],
    controllers: [SubscriptionController],
    providers: [SubscriptionService, Logger],
    exports: [SubscriptionService],
})
export class SubscriptionModule {}
