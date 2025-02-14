import { Logger, Module } from "@nestjs/common";
import { SupabaseController } from "./supabase.controller";
import { SupabaseService } from "./supabase.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Supabase } from "./entity/supabase.entity";
import { SupabaseConfigurationModule } from "../configuration/supabase";
import { HttpModule } from "@nestjs/axios";

@Module({
    imports: [
        TypeOrmModule.forFeature([Supabase]),
        SupabaseConfigurationModule,
        HttpModule,
    ],
    controllers: [SupabaseController],
    providers: [SupabaseService, Logger],
    exports: [SupabaseService],
})
export class SupabaseModule {}
