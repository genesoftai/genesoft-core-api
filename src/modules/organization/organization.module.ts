import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Organization } from "./entity/organization.entity";
import { OrganizationController } from "./organization.controller";
import { OrganizationService } from "./organization.service";
import { AuthModule } from "../auth/auth.module";
import { User } from "../user/entity/user.entity";
import { Project } from "../project/entity/project.entity";
import { Collection } from "../collection/entity/collection.entity";
@Module({
    imports: [
        TypeOrmModule.forFeature([Organization, User, Project, Collection]),
        AuthModule,
    ],
    controllers: [OrganizationController],
    providers: [OrganizationService, Logger],
    exports: [OrganizationService],
})
export class OrganizationModule {}
