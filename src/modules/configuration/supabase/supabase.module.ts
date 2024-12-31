import { Module } from "@nestjs/common";
import { SupabaseConfigurationService } from "./supabase.service";
import { ConfigModule, ConfigService } from "@nestjs/config";
import configuration from "./configuration";

@Module({
    imports: [ConfigModule.forRoot({ load: [configuration] })],
    providers: [ConfigService, SupabaseConfigurationService],
    exports: [ConfigService, SupabaseConfigurationService],
})
export class SupabaseConfigurationModule {}
