import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { SubscriptionService } from "./subscription.service";
import { AuthGuard } from "../auth/auth.guard";
import { CreateSubscriptionByCheckoutSessionDto } from "./dto/create-subscription.dto";

@Controller("subscription")
export class SubscriptionController {
    constructor(private readonly subscriptionService: SubscriptionService) {}

    @Get(":email")
    @UseGuards(AuthGuard)
    async getSubscriptionInfo(@Param("email") email: string): Promise<any> {
        return this.subscriptionService.getSubscriptionInfo(email);
    }

    @Get("organization/:organizationId")
    @UseGuards(AuthGuard)
    async getSubscriptionInfoByOrganizationId(
        @Param("organizationId") organizationId: string,
    ): Promise<any> {
        return this.subscriptionService.getSubscriptionInfoByOrganizationId(
            organizationId,
        );
    }

    @Post("checkout-session")
    @UseGuards(AuthGuard)
    async createSubscriptionByCheckoutSession(
        @Body() payload: CreateSubscriptionByCheckoutSessionDto,
    ): Promise<any> {
        return this.subscriptionService.createSubscriptionByCheckoutSession(
            payload,
        );
    }
}
