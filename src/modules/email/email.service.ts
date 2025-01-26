import { Injectable, Logger } from "@nestjs/common";
import { ThirdPartyConfigurationService } from "../configuration/third-party";
import { Resend } from "resend";
import { SaveEmailDto, SendEmailDto } from "./dto/send-email.dto";
import { SubscribeEmailDto } from "./dto/email-subscription.dto";
import { Repository } from "typeorm";
import { Email } from "./entity/email.entity";
import { InjectRepository } from "@nestjs/typeorm";

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
}
