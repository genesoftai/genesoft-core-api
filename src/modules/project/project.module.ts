import { Logger, Module } from "@nestjs/common";
import { ProjectService } from "./project.service";
import { ProjectController } from "./project.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Project } from "./entity/project.entity";
import { Branding } from "./entity/branding.entity";
import { Page } from "./entity/page.entity";
import { Feature } from "./entity/feature.entity";
import { WebApplication } from "./entity/web-application.entity";
import { GithubRepository } from "@modules/github/entity/github-repository.entity";
import { Feedback } from "../../../module/feedback/entity/feedback.entity";
import { ReferenceLink } from "../metadata/entity/reference-link.entity";
import { File } from "../metadata/entity/file.entity";
import { AWSConfigurationModule } from "../configuration/aws";
import { AuthModule } from "../auth/auth.module";
import { GithubModule } from "../github/github.module";
import { Iteration } from "../development/entity/iteration.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Project,
            Branding,
            Page,
            Feature,
            WebApplication,
            GithubRepository,
            Feedback,
            File,
            ReferenceLink,
            Iteration,
        ]),
        AWSConfigurationModule,
        AuthModule,
        GithubModule,
    ],
    providers: [ProjectService, Logger],
    controllers: [ProjectController],
    exports: [ProjectService],
})
export class ProjectModule {}
