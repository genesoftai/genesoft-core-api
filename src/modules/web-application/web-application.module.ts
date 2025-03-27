import { Module, Logger } from "@nestjs/common";
import { WebApplicationController } from "./web-application.controller";
import { WebApplicationService } from "./web-application.service";
import { ProjectModule } from "../project/project.module";
import { FrontendInfraModule } from "@/modules/frontend-infra/frontend-infra.module";
import { BackendInfraModule } from "@/modules/backend-infra/backend-infra.module";
import { SupabaseModule } from "../supabase/supabase.module";
import { Iteration } from "../development/entity/iteration.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RepositoryBuild } from "../repository-build/entity/repository-build.entity";
import { Project } from "../project/entity/project.entity";
@Module({
    imports: [
        ProjectModule,
        FrontendInfraModule,
        BackendInfraModule,
        SupabaseModule,
        TypeOrmModule.forFeature([Iteration, RepositoryBuild, Project]),
    ],
    controllers: [WebApplicationController],
    providers: [WebApplicationService, Logger],
})
export class WebApplicationModule {}
