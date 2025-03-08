import { Injectable, Logger } from "@nestjs/common";
import { ThirdPartyConfigurationService } from "../configuration/third-party";
import { Resend } from "resend";
import { SaveEmailDto, SendEmailDto } from "./dto/send-email.dto";
import { SubscribeEmailDto } from "./dto/email-subscription.dto";
import { Repository } from "typeorm";
import { Email } from "./entity/email.entity";
import { InjectRepository } from "@nestjs/typeorm";
import {
    SendContactEmailDto,
    SendSupportEmailDto,
} from "./dto/email-contact.dto";
import {
    GENESOFT_AI_EMAIL,
    GENESOFT_BASE_URL,
    GENESOFT_LOGO_IMAGE_URL,
    GENESOFT_SUPPORT_EMAIL_FROM,
} from "../constants/genesoft";

@Injectable()
export class EmailService {
    private serviceName: string;
    private resend: Resend;
    private readonly logger = new Logger(EmailService.name);
    constructor(
        private readonly thirdPartyConfigurationService: ThirdPartyConfigurationService,
        @InjectRepository(Email)
        private readonly emailRepository: Repository<Email>,
    ) {
        this.serviceName = EmailService.name;
        this.resend = new Resend(
            this.thirdPartyConfigurationService.resendApiKey,
        );
    }

    async sendEmail(payload: SendEmailDto) {
        const { topic, to } = payload;
        const { data, error } = await this.resend.emails.send(payload);

        if (error) {
            this.logger.error({
                message: `${this.serviceName}.sendEmail: Error sending email `,
                metadata: { payload, error },
            });
            throw error;
        }

        this.logger.log({
            message: `${this.serviceName}.sendEmail: Successful sending email`,
            metadata: { payload, data },
        });

        await this.saveEmails({
            topic,
            emails: to,
            resendId: data.id,
        });

        return data;
    }

    async saveEmails(payload: SaveEmailDto) {
        try {
            const rows = payload.emails.map((email) => ({
                email,
                resend_id: payload.resendId,
                topic: payload.topic,
            }));

            const result = await this.emailRepository.insert(rows);

            this.logger.log({
                message: `${this.serviceName}.saveEmails: Successful sending email`,
                metadata: { payload, rows, result },
            });
            return result;
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.saveEmails: Error sending email `,
                metadata: { payload, error },
            });
            throw error;
        }
    }

    async subscribeGenesoftEmail(payload: SubscribeEmailDto) {
        const { email } = payload;

        const { data, error } = await this.resend.contacts.create({
            email,
            unsubscribed: false,
            audienceId:
                this.thirdPartyConfigurationService
                    .resendGenesoftEmailAudienceId,
        });

        if (error) {
            this.logger.error({
                message: `${this.serviceName}.subscribeGenesoftEmail: Error subscribe Genesoft email`,
                metadata: { payload, error },
            });
            throw error;
        }

        this.logger.log({
            message: `${this.serviceName}.subscribeGenesoftEmail: Successfully subscribe Genesoft email`,
            metadata: { payload, data },
        });

        return data;
    }

    async sendContactEmail(payload: SendContactEmailDto) {
        const { companyName, email, reason } = payload;

        const data = await this.sendEmail({
            to: [email, GENESOFT_AI_EMAIL],
            subject: `We received your contact for enterprise plan request from ${companyName}`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="${GENESOFT_LOGO_IMAGE_URL}" alt="Genesoft Logo" style="max-width: 150px;">
                </div>
                <h2 style="color: #4a86e8; margin-bottom: 20px;">Thank You for Your Enterprise Plan Inquiry</h2>
                <p style="font-size: 16px; line-height: 1.5; color: #333;">
                    We've received your request for information about our enterprise plan.
                </p>
                <div style="background-color: #f5f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 15px;">
                        <strong>Company:</strong> ${companyName}<br>
                        <strong>Email:</strong> ${email}<br>
                        <strong>Inquiry Details:</strong> ${reason}
                    </p>
                </div>
                <p style="font-size: 16px; line-height: 1.5; color: #333;">
                    Our team will review your request and contact you shortly to discuss how Genesoft can meet your enterprise needs.
                </p>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 14px; color: #777;">
                    <p>If you have any immediate questions, please contact our support team at <a href="mailto:support@genesoftai.com" style="color: #4a86e8;">support@genesoftai.com</a>.</p>
                    <p style="text-align: center; margin-top: 15px;">
                        <a href="${GENESOFT_BASE_URL}" style="color: #4a86e8; text-decoration: none;">www.genesoftai.com</a>
                    </p>
                </div>
            </div>
            `,
            from: GENESOFT_SUPPORT_EMAIL_FROM,
        });

        return data;
    }

    async sendSupportEmail(payload: SendSupportEmailDto) {
        const { email, query } = payload;

        const data = await this.sendEmail({
            to: [email, GENESOFT_AI_EMAIL],
            subject: `Support Request from ${email}`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="${GENESOFT_LOGO_IMAGE_URL}" alt="Genesoft Logo" style="max-width: 150px;">
                </div>
                <h2 style="color: #4a86e8; margin-bottom: 20px;">Thank You for Contacting Support</h2>
                <p style="font-size: 16px; line-height: 1.5; color: #333;">
                    We've received your support request and will get back to you as soon as possible.
                </p>
                <div style="background-color: #f5f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 15px;">
                        <strong>Email:</strong> ${email}<br>
                        <strong>Query:</strong> ${query}
                    </p>
                </div>
                <p style="font-size: 16px; line-height: 1.5; color: #333;">
                    Our support team is reviewing your request and will respond shortly.
                </p>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 14px; color: #777;">
                    <p>For urgent matters, please contact our support team directly at <a href="mailto:support@genesoftai.com" style="color: #4a86e8;">support@genesoftai.com</a>.</p>
                    <p style="text-align: center; margin-top: 15px;">
                        <a href="${GENESOFT_BASE_URL}" style="color: #4a86e8; text-decoration: none;">www.genesoftai.com</a>
                    </p>
                </div>
            </div>
            `,
            from: GENESOFT_SUPPORT_EMAIL_FROM,
        });

        return data;
    }
}
