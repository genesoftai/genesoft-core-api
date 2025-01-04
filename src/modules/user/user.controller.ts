import {
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    UseGuards,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { User } from "./entity/user.entity";
import { AuthGuard } from "../auth/auth.guard";

@Controller("user")
@UseGuards(AuthGuard)
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get(":id")
    async getUserById(@Param("id", ParseUUIDPipe) id: string): Promise<User> {
        return this.userService.getUserById(id);
    }

    @Get("email/:email")
    async getUserByEmail(@Param("email") email: string): Promise<User> {
        return this.userService.getUserByEmail(email);
    }

    @Get("organization/:organizationId")
    async getUsersByOrganizationId(
        @Param("organizationId", ParseUUIDPipe) organizationId: string,
    ): Promise<User[]> {
        return this.userService.getUsersByOrganizationId(organizationId);
    }
}
