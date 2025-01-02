import { Module } from "@nestjs/common";
import { StripeConfigurationService } from "./stripe.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import configuration from "./configuration";

@Module({
    imports: [ConfigModule.forRoot({ load: [configuration] })],
    providers: [ConfigService, StripeConfigurationService],
    exports: [ConfigService, StripeConfigurationService],
})
export class StripeConfigurationModule {}
