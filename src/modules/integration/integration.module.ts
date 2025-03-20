import { Module } from "@nestjs/common";
import { IntegrationController } from "./integration.controller";
import { IntegrationService } from "./integration.service";
import { VercelProject } from "../frontend-infra/entity/vercel-project.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { FrontendInfraModule } from "../frontend-infra/frontend-infra.module";

@Module({
    imports: [
        HttpModule,
        TypeOrmModule.forFeature([VercelProject]),
        FrontendInfraModule,
    ],
    controllers: [IntegrationController],
    providers: [IntegrationService],
    exports: [IntegrationService],
})
export class IntegrationModule {}
