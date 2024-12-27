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

        user.organization_id = savedOrganization.id;
        await this.userRepository.save(user);
        this.logger.log({
            message: `${this.serviceName}.createOrganization: User linked to organization`,
            metadata: {
                userEmail,
                organizationId: savedOrganization.id,
                timestamp: new Date(),
            },
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
}
