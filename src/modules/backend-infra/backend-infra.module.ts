import { Module } from "@nestjs/common";
import { BackendInfraService } from "./backend-infra.service";
import { BackendInfraController } from "./backend-infra.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GithubRepository } from "@/modules/github/entity/github-repository.entity";
import { KoyebProject } from "./entity/koyeb-project.entity";
import { Supabase } from "@/modules/supabase/entity/supabase.entity";
import { HttpModule } from "@nestjs/axios";
import { SupabaseModule } from "@/modules/supabase/supabase.module";
import { AWSConfigurationModule } from "@/modules/configuration/aws";
import { KoyebConfigurationModule } from "@/modules/configuration/koyeb";
import { AppConfigurationModule } from "@/modules/configuration/app";
@Module({
    imports: [
        TypeOrmModule.forFeature([GithubRepository, Supabase, KoyebProject]),
        HttpModule,
        SupabaseModule,
        AWSConfigurationModule,
        KoyebConfigurationModule,
        AppConfigurationModule,
    ],
    providers: [BackendInfraService],
    exports: [BackendInfraService],
    controllers: [BackendInfraController],
})
export class BackendInfraModule {}
