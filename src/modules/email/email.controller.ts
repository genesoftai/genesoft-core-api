import { SendEmailDto } from "./dto/send-email.dto";
import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { EmailService } from "./email.service";
import { SubscribeEmailDto } from "./dto/email-subscription.dto";
import { AuthGuard } from "../auth/auth.guard";

@Controller("email")
export class EmailController {
    constructor(private readonly emailService: EmailService) {}

    @Post()
    @UseGuards(AuthGuard)
    async sendEmail(@Body() payload: SendEmailDto) {
        return this.emailService.sendEmail(payload);
    }

    @Post("subscription")
    @UseGuards(AuthGuard)
    async subscribeGenesoftEmail(@Body() payload: SubscribeEmailDto) {
        return this.emailService.subscribeGenesoftEmail(payload);
    }
}
