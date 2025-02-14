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
        switch (event.type) {
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted":
                const subscription = event.data.object as Stripe.Subscription;
                const customer = (await this.stripe.customers.retrieve(
                    subscription.customer as string,
                )) as Record<string, any>;
                const customerEmail = customer.email;
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
