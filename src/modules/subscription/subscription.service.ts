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
import { CreateSubscriptionByCheckoutSessionDto } from "./dto/create-subscription.dto";
import { Organization } from "../organization/entity/organization.entity";
import { v4 as uuidv4 } from "uuid";

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
        @InjectRepository(Organization)
        private organizationRepository: Repository<Organization>,
    ) {
        this.stripe = new Stripe(
            this.stripeConfigurationService.stripeSecretKey,
        );
    }

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
            metadata: subscription.metadata as any,
            status: subscription.status,
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
            price_id: subscription.items.data[0]?.price.id || null,
        };

        try {
            // Check if subscription already exists
            const existingSubscription =
                await this.subscriptionRepository.findOne({
                    where: { subscription_id: subscriptionId },
                });

            if (existingSubscription) {
                // Update existing subscription
                await this.subscriptionRepository.update(
                    { id: existingSubscription.id },
                    { ...subscriptionData } as any,
                );

                this.logger.log({
                    message: `${this.moduleName}.manageSubscriptionStatusChange: Subscription updated`,
                    metadata: { subscriptionData },
                });
            } else {
                // Create new subscription if it doesn't exist
                await this.subscriptionRepository.save(subscriptionData);

                this.logger.log({
                    message: `${this.moduleName}.manageSubscriptionStatusChange: New subscription created`,
                    metadata: { subscriptionData },
                });
            }

            this.logger.log({
                message: `${this.moduleName}.manageSubscriptionStatusChange: Processed subscription [${subscription.id}] for user [${userId}]`,
                metadata: { subscriptionId, userId },
            });
        } catch (error) {
            throw new HttpException(
                `Subscription update failed: ${error.message}`,
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    async getSubscriptionInfoByOrganizationId(
        organizationId: string,
    ): Promise<any> {
        if (!organizationId) {
            this.logger.error({
                message: `${this.moduleName}.getSubscriptionInfoByOrganizationId: Organization ID is required`,
                metadata: { organizationId },
            });
            throw new HttpException(
                "Organization ID is required",
                HttpStatus.BAD_REQUEST,
            );
        }

        this.logger.log({
            message: `${this.moduleName}.getSubscriptionInfoByOrganizationId: Retrieving subscription for organization [${organizationId}]`,
            metadata: { organizationId },
        });

        const result = await this.subscriptionRepository.findOne({
            where: { organization_id: organizationId },
            order: { created: "DESC" },
        });

        if (!result) {
            this.logger.warn({
                message: `${this.moduleName}.getSubscriptionInfoByOrganizationId: No subscription found for organization [${organizationId}]`,
                metadata: { organizationId },
            });
            return { status: SubscriptionStatus.NoSubscription };
        }

        const currentPeriodEnd = new Date(result.current_period_end).getTime();
        if (currentPeriodEnd < Date.now()) {
            this.logger.warn({
                message: `${this.moduleName}.getSubscriptionInfoByOrganizationId: Subscription expired for organization [${organizationId}]`,
                metadata: { organizationId, subscriptionId: result.id },
            });
            return { status: SubscriptionStatus.EndedSubscription };
        }

        this.logger.log({
            message: `${this.moduleName}.getSubscriptionInfoByOrganizationId: Retrieved subscription [${result.id}] for organization [${organizationId}]`,
            metadata: { result },
        });

        return result;
    }

    async createSubscriptionByCheckoutSession(
        payload: CreateSubscriptionByCheckoutSessionDto,
    ) {
        const { sessionId } = payload;

        const checkoutSession =
            await this.stripe.checkout.sessions.retrieve(sessionId);
        this.logger.log({
            message: `${this.moduleName}.createSubscriptionByCheckoutSession: Retrieved checkout session [${checkoutSession}]`,
            metadata: { checkoutSession },
        });
        const organizationId = checkoutSession.metadata.organization_id;
        this.logger.log({
            message: `${this.moduleName}.createSubscriptionByCheckoutSession: Retrieved organization ID [${organizationId}]`,
            metadata: { organizationId },
        });
        const customerId = checkoutSession.customer as string;
        this.logger.log({
            message: `${this.moduleName}.createSubscriptionByCheckoutSession: Retrieved customer ID [${customerId}]`,
            metadata: { customerId },
        });
        const subscriptionId = checkoutSession.subscription as string;
        this.logger.log({
            message: `${this.moduleName}.createSubscriptionByCheckoutSession: Retrieved subscription ID [${subscriptionId}]`,
            metadata: { subscriptionId },
        });

        const existingSubscription = await this.subscriptionRepository.findOne({
            where: { subscription_id: subscriptionId },
        });
        if (existingSubscription) {
            this.logger.log({
                message: `${this.moduleName}.createSubscriptionByCheckoutSession: Subscription already exists`,
                metadata: { existingSubscription },
            });
            return existingSubscription;
        }

        const subscription =
            await this.stripe.subscriptions.retrieve(subscriptionId);
        this.logger.log({
            message: `${this.moduleName}.createSubscriptionByCheckoutSession: Retrieved subscription [${subscriptionId}]`,
            metadata: { subscription },
        });

        const user = await this.userRepository.findOne({
            where: { email: checkoutSession.customer_email },
        });
        if (!user) {
            throw new HttpException("User not found", HttpStatus.NOT_FOUND);
        }
        user.customer_id = customerId;
        await this.userRepository.save(user);

        const organization = await this.organizationRepository.findOne({
            where: { id: organizationId },
        });
        if (!organization) {
            throw new HttpException(
                "Organization not found",
                HttpStatus.NOT_FOUND,
            );
        }

        organization.customer_id = customerId;
        await this.organizationRepository.save(organization);

        const subscriptionData = {
            id: uuidv4(),
            organization_id: organizationId,
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
            subscription_id: subscriptionId,
            tier: "startup",
        };

        const savedSubscription =
            await this.subscriptionRepository.save(subscriptionData);

        this.logger.log({
            message: `${this.moduleName}.createSubscriptionByCheckoutSession: Saved subscription [${savedSubscription}]`,
            metadata: { savedSubscription },
        });

        return savedSubscription;
    }
}
