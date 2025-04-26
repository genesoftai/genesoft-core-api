import {
    Controller,
    Post,
    Body,
    UseGuards,
    Res,
    UnauthorizedException,
    ForbiddenException,
    Param,
    Get,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { StripeService } from "../stripe/stripe.service";
import { SupabaseService } from "../supabase/supabase.service";
import { Response } from "express";
import { SubscriptionService } from "../subscription/subscription.service";
@Controller("projects/:projectId/subscribe")
@UseGuards(AuthGuard)
export class ProjectSubscribeController {
    constructor(
        private readonly stripeService: StripeService,
        private readonly supabaseService: SupabaseService,
        private readonly subscriptionService: SubscriptionService,
    ) {}

    @Post("instance")
    async subscribeInstance(
        @Param("projectId") projectId: string,
        @Body()
        data: {
            uid: string;
            returnUrl: string;
        },
        @Res() res: Response,
    ) {
        try {
            const user = await this.supabaseService.getUserByUid(data.uid);
            const session = await this.stripeService.createSubscription({
                priceId: "price_1REoyoHTZsQdR8K0I1AkxcLs",
                returnUrl: data.returnUrl,
                projectId: projectId,
                uid: data.uid,
                email: user.email,
            });
            return res.status(201).json({ id: session.id, url: session.url });
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                return res.status(401).send(error.message);
            }
            if (error instanceof ForbiddenException) {
                return res.status(403).send(error.message);
            }
            return res.status(400).send(error.message);
        }
    }

    @Post("database")
    async subscribeDatabase(
        @Param("projectId") projectId: string,
        @Body()
        data: {
            uid: string;
            returnUrl: string;
        },
        @Res() res: Response,
    ) {
        try {
            const user = await this.supabaseService.getUserByUid(data.uid);
            const session = await this.stripeService.createSubscription({
                priceId: process.env.STRIPE_PRICE_ID_DATABASE_E1,
                returnUrl: data.returnUrl,
                projectId: projectId,
                uid: data.uid,
                email: user.email,
            });
            return res.status(201).json({ id: session.id, url: session.url });
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                return res.status(401).send(error.message);
            }
            if (error instanceof ForbiddenException) {
                return res.status(403).send(error.message);
            }
            return res.status(400).send(error.message);
        }
    }

    @Get("")
    async getProjectSubscription(@Param("projectId") projectId: string) {
        const subscription =
            await this.subscriptionService.getSubscriptionByProjectId(
                projectId,
            );
        return subscription;
    }
}
