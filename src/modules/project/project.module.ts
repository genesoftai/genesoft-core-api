import { Logger, Module } from "@nestjs/common";
import { ProjectService } from "./project.service";
import { ProjectController } from "./project.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Project } from "./entity/project.entity";
import { Branding } from "./entity/branding.entity";
import { Page } from "./entity/page.entity";
import { Feature } from "./entity/feature.entity";
import { WebApplication } from "./entity/web-application.entity";
import { Github } from "./entity/github.entity";
import { Feedback } from "./entity/feedback.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Project,
            Branding,
            Page,
            Feature,
            WebApplication,
            Github,
            Feedback,
        ]),
    ],
    providers: [ProjectService, Logger],
    controllers: [ProjectController],
})
export class ProjectModule {}
