import {
    Controller,
    Headers,
    Post,
    RawBodyRequest,
    Req,
    Res,
} from "@nestjs/common";
import { Request, Response } from "express";
import { StripeWebhookService } from "./stripe-webhook.service";

@Controller("stripe")
export class StripeController {
    constructor(private readonly stripeWebhookService: StripeWebhookService) {}

    @Post("webhook")
    async handleStripeWebhook(
        @Headers("stripe-signature") sig: string,
        @Req() req: RawBodyRequest<Request>,
        @Res() res: Response,
    ) {
        try {
            const result = await this.stripeWebhookService.handleWebhook(
                req,
                sig,
            );
            return res.status(200).json(result);
        } catch (error) {
            return res.status(400).send(error.message);
        }
    }
}
