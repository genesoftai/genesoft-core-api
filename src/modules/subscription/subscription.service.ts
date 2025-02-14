import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import Stripe from "stripe";
import { toDateTime } from "@/utils/helpers";
import { StripeConfigurationService } from "@/modules/configuration/stripe";
import { UserService } from "@/modules/user/user.service";
import { SubscriptionStatus } from "@/modules/constants/subscription";
import { InjectRepository } from "@nestjs/typeorm";
import { Subscription } from "./entity/subscription.entity";
import { Repository } from "typeorm";
import { User } from "../user/entity/user.entity";

@Injectable()
export class SubscriptionService {
    private readonly stripe: Stripe;
    private readonly logger = new Logger(SubscriptionService.name);
    private readonly moduleName = SubscriptionService.name;

    constructor(
        private stripeConfigurationService: StripeConfigurationService,
        private userService: UserService,
        @InjectRepository(Subscription)
        private subscriptionRepository: Repository<Subscription>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {
        this.stripe = new Stripe(
            this.stripeConfigurationService.stripeSecretKey,
        );
    }

    private TRIAL_PERIOD_DAYS = 7;

    async getSubscriptionInfo(email: string): Promise<any> {
        const user = await this.userService.getUserByEmail(email);
        if (!user) {
            this.logger.error({
                message: `${this.moduleName}.getSubscriptionInfo: User not found for email [${email}]`,
                metadata: { email },
            });
            throw new HttpException("User not found", HttpStatus.NOT_FOUND);
        }

        this.logger.log({
            message: `${this.moduleName}.getSubscriptionInfo: Retrieved user [${user.id}]`,
            metadata: { user },
        });

        const result = await this.subscriptionRepository.findOne({
            where: { organization_id: user.organization_id },
            order: { created: "DESC" },
        });

        if (!result) {
            this.logger.warn({
                message: `${this.moduleName}.getSubscriptionInfo: No subscription found for user [${user.id}]`,
                metadata: { user },
            });
            return { status: SubscriptionStatus.NoSubscription };
        }

        const currentPeriodEnd = new Date(result.current_period_end).getTime();
        if (currentPeriodEnd < Date.now()) {
            this.logger.warn({
                message: `${this.moduleName}.getSubscriptionInfo: Subscription expired for user [${user.id}]`,
                metadata: { user, subscriptionId: result.id },
            });
            return { status: SubscriptionStatus.EndedSubscription };
        }

        this.logger.log({
            message: `${this.moduleName}.getSubscriptionInfo: Retrieved subscription [${result.id}] for user [${user.id}]`,
            metadata: { result },
        });

        return result;
    }

    async manageSubscriptionStatusChange(
        subscriptionId: string,
        customerId: string,
        email: string,
    ): Promise<void> {
        const subscription = await this.stripe.subscriptions.retrieve(
            subscriptionId,
            {
                expand: ["default_payment_method"],
            },
        );

        // TODO: add `customer_id` column to user or oganization ?
        await this.userService.updateUserCustomerId({
            customerId,
            email,
        });

        const user = await this.userService.getUserByEmail(email);
        this.logger.log({
            message: `${this.moduleName}.manageSubscriptionStatusChange: Retrieved user [${user.id}]`,
            metadata: { user },
        });
        const userId = user.id;

        this.logger.log({
            message: `${this.moduleName}.manageSubscriptionStatusChange: Retrieved user [${userId}] for subscription [${subscriptionId}]`,
            metadata: { userId, subscriptionId },
        });

        const subscriptionData = {
            id: subscription.id,
            organization_id: user.organization_id,
            metadata: subscription.metadata,
            status: subscription.status,
            price_id: subscription.items.data[0].price.id,
            quantity: subscription.items.data[0].quantity,
            cancel_at_period_end: subscription.cancel_at_period_end,
            cancel_at: subscription.cancel_at
                ? toDateTime(subscription.cancel_at)
                : null,
            canceled_at: subscription.canceled_at
                ? toDateTime(subscription.canceled_at)
                : null,
            current_period_start: toDateTime(subscription.current_period_start),
            current_period_end: toDateTime(subscription.current_period_end),
            created: toDateTime(subscription.created),
            ended_at: subscription.ended_at
                ? toDateTime(subscription.ended_at)
                : null,
            trial_start: subscription.trial_start
                ? toDateTime(subscription.trial_start)
                : null,
            trial_end: subscription.trial_end
                ? toDateTime(subscription.trial_end)
                : null,
        };

        try {
            await this.subscriptionRepository.save(subscriptionData);

            this.logger.log({
                message: `${this.moduleName}.manageSubscriptionStatusChange: Subscription upserted`,
                metadata: { subscriptionData },
            });

            this.logger.log({
                message: `${this.moduleName}.manageSubscriptionStatusChange: Inserted/updated subscription [${subscription.id}] for user [${userId}]`,
                metadata: { subscriptionId, userId },
            });
        } catch (error) {
            throw new HttpException(
                `Subscription insert/update failed: ${error.message}`,
                HttpStatus.BAD_REQUEST,
            );
        }
    }
}
