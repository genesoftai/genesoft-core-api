import { Injectable, Logger } from "@nestjs/common";
import Stripe from "stripe";
import { StripeConfigurationService } from "../configuration/stripe";
import { AppConfigurationService } from "@modules/configuration/app";

@Injectable()
export class StripeService {
    private readonly logger = new Logger(StripeService.name);
    private readonly stripeKey: string;

    constructor(
        private readonly stripeConfigurationService: StripeConfigurationService,
        private readonly appConfigService: AppConfigurationService,
    ) {
        this.stripeKey = this.stripeConfigurationService.stripeSecretKey;
    }

    /**
     * Create or retrieve a Stripe customer for the user
     */
    private async createCustomer(
        stripe: Stripe,
        uid: string,
        email: string,
    ): Promise<Stripe.Customer> {
        // Search for existing customer
        const existingCustomers = await stripe.customers.list({
            email: email,
            limit: 1,
        });

        if (existingCustomers.data.length > 0) {
            return existingCustomers.data[0];
        }

        // Create new customer if not found
        return await stripe.customers.create({
            email: email,
            metadata: {
                uid: uid,
            },
        });
    }

    /**
     * Create a subscription checkout session
     */
    async createSubscription(data: {
        returnUrl?: string;
        priceId: string;
        uid: string;
        email: string;
        projectId: string;
    }): Promise<Stripe.Checkout.Session> {
        // Use test key if testMode is true
        const stripeKeyToUse = this.stripeKey;
        const stripe = new Stripe(stripeKeyToUse);

        // Create or get customer
        const customer = await this.createCustomer(
            stripe,
            data.uid,
            data.email,
        );

        this.logger.log("Customer created", { customer });

        // Configure the checkout session
        const sessionConfig: Stripe.Checkout.SessionCreateParams = {
            success_url:
                data.returnUrl ??
                this.appConfigService.genesoftWebBaseUrl +
                    "/subscription/success",
            customer: customer.id,
            line_items: [
                {
                    price: data.priceId,
                    quantity: 1,
                },
            ],
            mode: "subscription",
            metadata: {
                uid: data.uid,
                projectId: data.projectId,
            },
        };

        this.logger.log("Creating subscription session", { sessionConfig });

        // Create the checkout session
        const session = await stripe.checkout.sessions.create(sessionConfig);
        this.logger.log("Subscription session created", {
            sessionId: session.id,
        });

        return session;
    }
}
