import { Module } from "@nestjs/common";
import { FrontendInfraService } from "./frontend-infra.service";
import { FrontendInfraController } from "./frontend-infra.controller";
import { VercelConfigurationModule } from "@/modules/configuration/vercel";
import { GithubRepository } from "@/modules/github/entity/github-repository.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { VercelProject } from "./entity/vercel-project.entity";
import { Supabase } from "@/modules/supabase/entity/supabase.entity";
import { KoyebProject } from "@/modules/backend-infra/entity/koyeb-project.entity";
import { SupabaseModule } from "@/modules/supabase/supabase.module";
import { BackendInfraModule } from "@/modules/backend-infra/backend-infra.module";

@Module({
    imports: [
        VercelConfigurationModule,
        TypeOrmModule.forFeature([
            GithubRepository,
            VercelProject,
            Supabase,
            KoyebProject,
        ]),
        HttpModule,
        SupabaseModule,
        BackendInfraModule,
    ],
    providers: [FrontendInfraService],
    controllers: [FrontendInfraController],
    exports: [FrontendInfraService],
})
export class FrontendInfraModule {}
