import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OrganizationController } from "./organization.controller";
import { OrganizationService } from "./organization.service";
import { Organization } from "./entity/organization.entity";
import { User } from "../user/entity/user.entity";
import { Project } from "../project/entity/project.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Organization, User, Project])],
    controllers: [OrganizationController],
    providers: [OrganizationService, Logger],
    exports: [OrganizationService],
})
export class OrganizationModule {}
