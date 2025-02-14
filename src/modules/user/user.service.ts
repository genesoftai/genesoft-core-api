import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entity/user.entity";
import { Organization } from "../organization/entity/organization.entity";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Organization)
        private readonly organizationRepository: Repository<Organization>,
    ) {}

    async getUserById(id: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ["organization"],
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return user;
    }

    async getUserByEmail(email: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { email },
            relations: ["organization"],
        });

        if (!user) {
            throw new NotFoundException(`User with email ${email} not found`);
        }

        return user;
    }

    async getUsersByOrganizationId(organizationId: string): Promise<User[]> {
        return this.userRepository.find({
            where: { organization_id: organizationId },
            relations: ["organization"],
        });
    }

    async updateUserCustomerId({
        customerId,
        email,
    }: {
        customerId: string;
        email: string;
    }): Promise<void> {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new NotFoundException(`User with email ${email} not found`);
        }
        await this.userRepository.update(
            { id: user.id },
            { customer_id: customerId },
        );
        await this.organizationRepository.update(
            { id: user.organization_id },
            { customer_id: customerId },
        );
    }
}
