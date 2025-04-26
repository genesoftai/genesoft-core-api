import { Logger, Module } from "@nestjs/common";
import { CollectionController } from "./collection.controller";
import { CollectionService } from "./collection.service";
import { Collection } from "./entity/collection.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppConfigurationModule } from "../configuration/app";
import { Project } from "../project/entity/project.entity";
import { GithubRepository } from "../github/entity/github-repository.entity";
@Module({
    imports: [
        TypeOrmModule.forFeature([Collection, Project, GithubRepository]),
        AppConfigurationModule,
    ],
    controllers: [CollectionController],
    providers: [CollectionService, Logger],
    exports: [CollectionService],
})
export class CollectionModule {}
