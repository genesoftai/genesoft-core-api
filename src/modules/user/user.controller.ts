import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Put,
    UseGuards,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { User } from "./entity/user.entity";
import { AuthGuard } from "../auth/auth.guard";
import { UpdateUserOrganizationDto } from "./dto/user-organization.dto";
import {
    UpdateUserImageByEmailDto,
    UpdateUserImageDto,
} from "./dto/user-metadata.dto";

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

    @Patch("email/:email/image")
    async updateUserImageByEmail(
        @Param("email") email: string,
        @Body() payload: UpdateUserImageByEmailDto,
    ): Promise<object> {
        return this.userService.updateUserImageByEmail(email, payload);
    }

    @Put("organization")
    async updateUserOrganization(
        @Body() payload: UpdateUserOrganizationDto,
    ): Promise<object> {
        return this.userService.updateUserOrganization(payload);
    }

    @Get("organization/:organizationId")
    async getUsersByOrganizationId(
        @Param("organizationId", ParseUUIDPipe) organizationId: string,
    ): Promise<User[]> {
        return this.userService.getUsersByOrganizationId(organizationId);
    }

    @Patch("image")
    async updateUserImage(
        @Body() payload: UpdateUserImageDto,
    ): Promise<object> {
        return this.userService.updateUserImage(payload);
    }
}
