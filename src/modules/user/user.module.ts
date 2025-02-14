import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { User } from "./entity/user.entity";
import { AuthModule } from "../auth/auth.module";
import { Organization } from "../organization/entity/organization.entity";
@Module({
    imports: [TypeOrmModule.forFeature([User, Organization]), AuthModule],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule {}
