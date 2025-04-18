import {
    Injectable,
    HttpException,
    HttpStatus,
    Logger,
    Req,
    RawBodyRequest,
} from "@nestjs/common";
import { Request } from "express";
import Stripe from "stripe";
import { SubscriptionService } from "@/modules/subscription/subscription.service"; // Import the SubscriptionService
import { StripeConfigurationService } from "../configuration/stripe";
import { BackendInfraService } from "@modules/backend-infra/backend-infra.service";
import { ProjectDbManagerService } from "@modules/project-db/project-db-manager.service";
@Injectable()
export class StripeWebhookService {
    private relevantEvents = new Set([
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
    ]);
    private readonly stripe: Stripe;
    private readonly webhookSecret: string;
    private readonly logger = new Logger(StripeWebhookService.name);

    constructor(
        private readonly subscriptionService: SubscriptionService,
        private readonly stripeConfigurationService: StripeConfigurationService,
        private readonly backendInfraService: BackendInfraService,
        private readonly projectDbManagerService: ProjectDbManagerService,
    ) {
        this.stripe = new Stripe(
            this.stripeConfigurationService.stripeSecretKey,
        );
        this.webhookSecret =
            this.stripeConfigurationService.stripeWebhookSecret;
    } // Inject the SubscriptionService

    async handleWebhook(
        @Req() req: RawBodyRequest<Request>,
        sig: string,
    ): Promise<any> {
        const body = req.body;
        let event: Stripe.Event;

        if (!sig || !this.webhookSecret) {
            throw new HttpException(
                "Webhook secret not found.",
                HttpStatus.BAD_REQUEST,
            );
        }

        try {
            event = this.stripe.webhooks.constructEvent(
                body,
                sig,
                this.webhookSecret,
            );
            this.logger.log({
                message: `🔔 Webhook received: ${event.type}`,
                // metadata: { event },
            });
        } catch (err) {
            this.logger.log({
                message: `❌ Error message: ${err.message}`,
                metadata: { error: err },
            });
            throw new HttpException(
                `Webhook Error: ${err.message}`,
                HttpStatus.BAD_REQUEST,
            );
        }

        if (this.relevantEvents.has(event.type)) {
            console.log({ message: "Handling event", eventType: event.type });
            try {
                await this.handleEvent(event);
            } catch (error) {
                this.logger.log({
                    message: "Webhook handler failed.",
                    metadata: { error },
                });
                throw new HttpException(
                    "Webhook handler failed.",
                    HttpStatus.BAD_REQUEST,
                );
            }
        } else {
            throw new HttpException(
                `Unsupported event type: ${event.type}`,
                HttpStatus.BAD_REQUEST,
            );
        }

        return { received: true };
    }

    private async handleEvent(event: Stripe.Event): Promise<void> {
        let customerEmail: string;
        let customer: Record<string, any>;
        switch (event.type) {
            case "checkout.session.completed":
                const checkoutSession = event.data
                    .object as Stripe.Checkout.Session;
                customer = (await this.stripe.customers.retrieve(
                    checkoutSession.customer as string,
                )) as Record<string, any>;
                customerEmail = customer.email;
                this.logger.log({
                    message: `Checkout session completed: ${checkoutSession.id}`,
                    metadata: { checkoutSession, customer },
                });
                const lookupKey = checkoutSession.line_items?.data[0]?.price?.lookup_key;

                switch (lookupKey) {
                    case "instance-e1":
                        await this.subscriptionService.createSubscriptionByCheckoutSession(
                            {
                                sessionId: checkoutSession.id,
                                tier: "instance-e1",
                            },
                        );

                        await this.backendInfraService.createNewProjectInKoyeb(
                            checkoutSession.metadata.projectId,
                        );
                        break;
                    case "db-e1":
                        await this.subscriptionService.createSubscriptionByCheckoutSession(
                            {
                                sessionId: checkoutSession.id,
                                tier: "db-e1",
                            },
                        );

                        await this.projectDbManagerService.createProjectDatabase(
                            checkoutSession.metadata.projectId,
                        );
                        break;
                    default:
                        throw new Error("Unhandled relevant event!");
                }
                break;
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted":
                const subscription = event.data.object as Stripe.Subscription;
                customer = (await this.stripe.customers.retrieve(
                    subscription.customer as string,
                )) as Record<string, any>;
                customerEmail = customer.email;
                this.logger.log({
                    message: `Subscription event: ${event.type}`,
                    metadata: { subscription, customer },
                });
                await this.subscriptionService.manageSubscriptionStatusChange(
                    subscription.id,
                    subscription.customer as string,
                    customerEmail as string,
                );
                break;
            default:
                throw new Error("Unhandled relevant event!");
        }
    }
}
