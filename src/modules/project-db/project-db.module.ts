import { Module } from "@nestjs/common";
import { ProjectDbManagerService } from "./project-db-manager.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProjectDb } from "./entity/project-db.entity";
import { Project } from "@/modules/project/entity/project.entity";
import { ConfigModule } from "@nestjs/config";
@Module({
    imports: [TypeOrmModule.forFeature([Project, ProjectDb]), ConfigModule],
    providers: [ProjectDbManagerService],
    exports: [ProjectDbManagerService],
})
export class ProjectDbModule {}
