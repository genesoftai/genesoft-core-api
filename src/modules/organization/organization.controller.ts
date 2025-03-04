import {
    Controller,
    Get,
    Param,
    Post,
    Body,
    Patch,
    Delete,
    UseGuards,
} from "@nestjs/common";
import { OrganizationService } from "./organization.service";
import { Organization } from "./entity/organization.entity";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { AuthGuard } from "../auth/auth.guard";
import {
    AddUserToOrganization,
    RemoveUserFromOrganization,
    UpdateUserRole,
} from "./dto/update-organization.dto";
import { User } from "../user/entity/user.entity";

@Controller("organization")
@UseGuards(AuthGuard)
export class OrganizationController {
    constructor(private readonly organizationService: OrganizationService) {}

    @Get()
    async getAllOrganizations(): Promise<Organization[]> {
        return await this.organizationService.getAllOrganizations();
    }

    @Post()
    async createOrganization(
        @Body() payload: CreateOrganizationDto,
    ): Promise<Organization> {
        return await this.organizationService.createOrganization(payload);
    }

    @Post("user")
    async addUserToOrganization(
        @Body() payload: AddUserToOrganization,
    ): Promise<object> {
        return this.organizationService.addUserToOrganization(payload);
    }

    @Patch("user")
    async updateUserRole(@Body() payload: UpdateUserRole): Promise<object> {
        return this.organizationService.updateUserRole(payload);
    }

    @Delete("user")
    async removeUserFromOrganization(
        @Body() payload: RemoveUserFromOrganization,
    ): Promise<void> {
        return this.organizationService.removeUserFromOrganization(payload);
    }

    @Get("user/:id")
    async getOrganizationsForUser(
        @Param("id") id: string,
    ): Promise<Organization[]> {
        return this.organizationService.getOrganizationsForUser(id);
    }

    @Get(":id")
    async getOrganizationById(@Param("id") id: string): Promise<object> {
        return await this.organizationService.getOrganizationById(id);
    }

    @Patch(":id")
    async updateOrganization(
        @Param("id") id: string,
        @Body() payload: Partial<Organization>,
    ): Promise<object> {
        return await this.organizationService.updateOrganization(id, payload);
    }

    @Delete(":id")
    async deleteOrganization(@Param("id") id: string): Promise<void> {
        return await this.organizationService.deleteOrganization(id);
    }

    @Get(":id/projects")
    async getOrganizationProjects(@Param("id") id: string): Promise<object> {
        return await this.organizationService.getOrganizationProjects(id);
    }

    @Get(":id/users")
    async getUsersForOrganization(@Param("id") id: string): Promise<object[]> {
        return this.organizationService.getUsersForOrganization(id);
    }
}
