import {
    Controller,
    Get,
    Param,
    Post,
    Body,
    Patch,
    Delete,
} from "@nestjs/common";
import { OrganizationService } from "./organization.service";
import { Organization } from "./entity/organization.entity";
import { CreateOrganizationDto } from "./dto/create-organization.dto";

@Controller("organization")
export class OrganizationController {
    constructor(private readonly organizationService: OrganizationService) {}

    @Get()
    async getAllOrganizations(): Promise<Organization[]> {
        return await this.organizationService.getAllOrganizations();
    }

    @Get(":id")
    async getOrganizationById(@Param("id") id: string): Promise<object> {
        return await this.organizationService.getOrganizationById(id);
    }

    @Post()
    async createOrganization(
        @Body() payload: CreateOrganizationDto,
    ): Promise<Organization> {
        return await this.organizationService.createOrganization(payload);
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
}
