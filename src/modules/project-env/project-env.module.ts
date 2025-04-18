import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Project } from "../project/entity/project.entity";
import { ProjectEnv } from "../project-env/entity/project-env.entity";
import { ProjectEnvManagementService } from "./project-env-management.service";
import { FrontendInfraModule } from "@modules/frontend-infra/frontend-infra.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Project, ProjectEnv]),
        FrontendInfraModule,
    ],
    providers: [ProjectEnvManagementService],
    controllers: [],
    exports: [ProjectEnvManagementService],
})
export class ProjectEnvModule {}
