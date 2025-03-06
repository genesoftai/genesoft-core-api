import {
    Inject,
    Injectable,
    Logger,
    LoggerService,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Organization } from "./entity/organization.entity";
import { User } from "../user/entity/user.entity";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { Project } from "../project/entity/project.entity";
import {
    AddUserToOrganization,
    RemoveUserFromOrganization,
    UpdateUserRole,
} from "./dto/update-organization.dto";
import { OrganizationRole } from "../constants/organization";
import { UserWithRole } from "../types/organization";

@Injectable()
export class OrganizationService {
    private readonly serviceName = "OrganizationService";

    constructor(
        @Inject(Logger)
        private readonly logger: LoggerService,
        @InjectRepository(Organization)
        private organizationRepository: Repository<Organization>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Project)
        private projectRepository: Repository<Project>,
    ) {
        this.logger.log({
            message: `${this.serviceName}.constructor: Service initialized`,
            metadata: { timestamp: new Date() },
        });
    }

    async getAllOrganizations(): Promise<Organization[]> {
        this.logger.log({
            message: `${this.serviceName}.getAllOrganizations: Fetching all organizations`,
            metadata: { timestamp: new Date() },
        });
        const organizations = await this.organizationRepository.find();
        this.logger.log({
            message: `${this.serviceName}.getAllOrganizations: Retrieved organizations`,
            metadata: { count: organizations.length, timestamp: new Date() },
        });
        return organizations;
    }

    async getOrganizationById(id: string): Promise<object> {
        this.logger.log({
            message: `${this.serviceName}.getOrganizationById: Fetching organization and users`,
            metadata: { id, timestamp: new Date() },
        });

        const organization = await this.organizationRepository.findOne({
            where: { id },
        });

        if (!organization) {
            this.logger.warn({
                message: `${this.serviceName}.getOrganizationById: Organization not found`,
                metadata: { id, timestamp: new Date() },
            });
            return organization;
        }

        const users = await this.userRepository.find({
            where: { organization_id: id },
        });

        const organizationWithUsers = {
            ...organization,
            users,
        };

        this.logger.log({
            message: `${this.serviceName}.getOrganizationById: Organization and users found`,
            metadata: {
                id,
                name: organization.name,
                userCount: users.length,
                timestamp: new Date(),
            },
        });

        return organizationWithUsers;
    }

    async getOrganizationProjects(id: string): Promise<object> {
        const projects = await this.projectRepository.find({
            where: { organization_id: id },
        });
        return projects;
    }

    async createOrganization(
        payload: CreateOrganizationDto,
    ): Promise<Organization> {
        const { userEmail, ...organizationData } = payload;
        this.logger.log({
            message: `${this.serviceName}.createOrganization: Creating new organization`,
            metadata: { userEmail, organizationData, timestamp: new Date() },
        });

        // Create and save the organization
        const newOrganization =
            this.organizationRepository.create(organizationData);
        const savedOrganization =
            await this.organizationRepository.save(newOrganization);

        this.logger.log({
            message: `${this.serviceName}.createOrganization: Organization created`,
            metadata: {
                organizationId: savedOrganization.id,
                timestamp: new Date(),
            },
        });

        // Find and update the user with the new organization
        const user = await this.userRepository.findOne({
            where: { email: userEmail },
        });
        if (!user) {
            this.logger.error({
                message: `${this.serviceName}.createOrganization: User not found`,
                metadata: { userEmail, timestamp: new Date() },
            });
            throw new NotFoundException(
                `User with email ${userEmail} not found`,
            );
        }

        await this.userRepository.save(user);
        this.logger.log({
            message: `${this.serviceName}.createOrganization: User linked to organization`,
            metadata: {
                userEmail,
                organizationId: savedOrganization.id,
                timestamp: new Date(),
            },
        });

        await this.addUserToOrganization({
            userId: user.id,
            organizationId: savedOrganization.id,
            role: OrganizationRole.Owner,
        });

        return savedOrganization;
    }

    async updateOrganization(
        id: string,
        payload: Partial<Organization>,
    ): Promise<object> {
        this.logger.log({
            message: `${this.serviceName}.updateOrganization: Updating organization`,
            metadata: { id, payload, timestamp: new Date() },
        });

        await this.organizationRepository.update(id, payload);
        const updated = await this.getOrganizationById(id);

        this.logger.log({
            message: `${this.serviceName}.updateOrganization: Organization updated`,
            metadata: { id, timestamp: new Date() },
        });
        return updated;
    }

    async deleteOrganization(id: string): Promise<void> {
        this.logger.log({
            message: `${this.serviceName}.deleteOrganization: Deleting organization`,
            metadata: { id, timestamp: new Date() },
        });

        await this.organizationRepository.delete(id);

        this.logger.log({
            message: `${this.serviceName}.deleteOrganization: Organization deleted`,
            metadata: { id, timestamp: new Date() },
        });
    }

    async addUserToOrganization(
        payload: AddUserToOrganization,
    ): Promise<object> {
        this.logger.log({
            message: `${this.serviceName}.addUserToOrganization: Adding user to organization`,
            metadata: { payload, timestamp: new Date() },
        });
        const { userId, organizationId, role, email } = payload;

        // Get user and organization
        const user = await this.userRepository.findOne({
            where: email ? { email } : { id: userId },
        });
        const organization = await this.organizationRepository.findOne({
            where: { id: organizationId },
        });

        if (!user || !organization) {
            throw new Error("User or organization not found");
        }

        // Add organization to user's organization_ids array if not already present
        if (!user.organization_ids.includes(organizationId)) {
            user.organization_ids = [...user.organization_ids, organizationId];
        }

        // Update user's role in the organization
        const orgRole = organization.role as Record<string, string>;
        orgRole[user.id] = role;
        organization.role = orgRole;

        // Save changes
        const userSaved = await this.userRepository.save(user);
        const organizationSaved =
            await this.organizationRepository.save(organization);

        this.logger.log({
            message: `${this.serviceName}.addUserToOrganization: User added to organization`,
            metadata: {
                userId: user.id,
                organizationId,
                role,
                timestamp: new Date(),
            },
        });

        return { user: userSaved, organization: organizationSaved };
    }

    async updateUserRole(payload: UpdateUserRole): Promise<object> {
        this.logger.log({
            message: `${this.serviceName}.updateUserRole: Updating user role in organization`,
            metadata: { payload, timestamp: new Date() },
        });

        const { userId, organizationId, role, email } = payload;

        // Get user if email is provided
        let actualUserId = userId;
        if (email) {
            const user = await this.userRepository.findOne({
                where: { email },
            });
            if (!user) {
                throw new Error("User not found");
            }
            actualUserId = user.id;
        }

        // Get organization
        const organization = await this.organizationRepository.findOne({
            where: { id: organizationId },
        });

        if (!organization) {
            throw new Error("Organization not found");
        }

        // Update user's role in the organization
        const orgRole = organization.role as Record<string, string>;
        orgRole[actualUserId] = role;
        organization.role = orgRole;

        // Save changes
        const organizationSaved =
            await this.organizationRepository.save(organization);

        this.logger.log({
            message: `${this.serviceName}.updateUserRole: User role updated in organization`,
            metadata: {
                userId: actualUserId,
                organizationId,
                role,
                timestamp: new Date(),
            },
        });

        return { organization: organizationSaved };
    }

    async removeUserFromOrganization(
        payload: RemoveUserFromOrganization,
    ): Promise<void> {
        this.logger.log({
            message: `${this.serviceName}.removeUserFromOrganization: Removing user from organization`,
            metadata: { payload, timestamp: new Date() },
        });

        const { userId, organizationId, email } = payload;

        // Get user and organization
        const user = await this.userRepository.findOne({
            where: email ? { email } : { id: userId },
        });
        const organization = await this.organizationRepository.findOne({
            where: { id: organizationId },
        });

        if (!user || !organization) {
            throw new Error("User or organization not found");
        }

        // Remove organization from user's organization_ids array
        user.organization_ids = user.organization_ids.filter(
            (id) => id !== organizationId,
        );

        // Remove user's role from the organization
        const orgRole = organization.role as Record<string, string>;
        delete orgRole[user.id];
        organization.role = orgRole;

        // Save changes
        await this.userRepository.save(user);
        await this.organizationRepository.save(organization);

        this.logger.log({
            message: `${this.serviceName}.removeUserFromOrganization: User removed from organization`,
            metadata: {
                userId: user.id,
                organizationId,
                timestamp: new Date(),
            },
        });
    }

    async getOrganizationsForUser(userId: string): Promise<Organization[]> {
        this.logger.log({
            message: `${this.serviceName}.getOrganizationsForUser: Getting all organizations for user`,
            metadata: { userId, timestamp: new Date() },
        });

        // Get user
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new Error("User not found");
        }

        // Get all organizations for the user based on organization_ids
        const organizations = await this.organizationRepository.findByIds(
            user.organization_ids,
        );

        this.logger.log({
            message: `${this.serviceName}.getOrganizationsForUser: Retrieved organizations for user`,
            metadata: {
                userId,
                count: organizations.length,
                timestamp: new Date(),
            },
        });

        return organizations;
    }

    async getUsersForOrganization(
        organizationId: string,
    ): Promise<UserWithRole[]> {
        this.logger.log({
            message: `${this.serviceName}.getUsersForOrganization: Getting all users for organization`,
            metadata: { organizationId, timestamp: new Date() },
        });

        // Get organization
        const organization = await this.organizationRepository.findOne({
            where: { id: organizationId },
        });

        if (!organization) {
            throw new Error("Organization not found");
        }

        // Get user IDs from organization roles
        const userIds = Object.keys(
            organization.role as Record<string, string>,
        );

        // Get all users for the organization
        const users = await this.userRepository.findByIds(userIds);

        const usersWithRoles = users.map((user) => ({
            ...user,
            role: organization.role[user.id],
        }));

        this.logger.log({
            message: `${this.serviceName}.getUsersForOrganization: Retrieved users for organization`,
            metadata: {
                organizationId,
                count: users.length,
                timestamp: new Date(),
            },
        });

        return usersWithRoles;
    }
}
