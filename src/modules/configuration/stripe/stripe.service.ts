import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class StripeConfigurationService {
    constructor(private configService: ConfigService) {}

    get stripeSecretKey() {
        return this.configService.get("stripe.stripeSecretKey");
    }

    get stripeWebhookSecret() {
        return this.configService.get("stripe.stripeWebhookSecret");
    }
}
