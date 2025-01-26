import { Module, Logger } from "@nestjs/common";
import { EmailService } from "./email.service";
import { EmailController } from "./email.controller";
import { ThirdPartyConfigurationModule } from "../configuration/third-party";
import { AuthModule } from "../auth/auth.module";
import { Email } from "./entity/email.entity";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [
        ThirdPartyConfigurationModule,
        AuthModule,
        TypeOrmModule.forFeature([Email]),
    ],
    controllers: [EmailController],
    providers: [EmailService, Logger],
    exports: [EmailService],
})
export class EmailModule {}
