import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { SubscriptionService } from "./subscription.service";
import { AuthGuard } from "../auth/auth.guard";

@Controller("subscription")
export class SubscriptionController {
    constructor(private readonly subscriptionService: SubscriptionService) {}

    @Get(":email")
    @UseGuards(AuthGuard)
    async getSubscriptionInfo(@Param("email") email: string): Promise<any> {
        return this.subscriptionService.getSubscriptionInfo(email);
    }
}
