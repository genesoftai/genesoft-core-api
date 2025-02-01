import { Module } from "@nestjs/common";
import { FrontendInfraService } from "./frontend-infra.service";
import { FrontendInfraController } from "./frontend-infra.controller";
import { VercelConfigurationModule } from "@/modules/configuration/vercel";
import { GithubRepository } from "@/modules/github/entity/github-repository.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { VercelProject } from "./entity/vercel-project.entity";

@Module({
    imports: [
        VercelConfigurationModule,
        TypeOrmModule.forFeature([GithubRepository, VercelProject]),
        HttpModule,
    ],
    providers: [FrontendInfraService],
    controllers: [FrontendInfraController],
    exports: [FrontendInfraService],
})
export class FrontendInfraModule {}
