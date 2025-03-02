import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entity/user.entity";
import { Organization } from "../organization/entity/organization.entity";
import { UpdateUserOrganizationDto } from "./dto/user-organization.dto";
import {
    UpdateUserImageByEmailDto,
    UpdateUserImageDto,
} from "./dto/user-metadata.dto";

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

    async updateUserOrganization(
        payload: UpdateUserOrganizationDto,
    ): Promise<object> {
        const user = await this.userRepository.findOne({
            where: { id: payload.userId },
        });
        if (!user) {
            throw new NotFoundException(
                `User with ID ${payload.userId} not found`,
            );
        }
        const organization = await this.organizationRepository.findOne({
            where: { id: payload.organizationId },
        });
        if (!organization) {
            throw new NotFoundException(
                `Organization with ID ${payload.organizationId} not found`,
            );
        }
        await this.userRepository.update(
            { id: payload.userId },
            { organization_id: payload.organizationId },
        );
        const updatedUser = await this.userRepository.findOne({
            where: { id: payload.userId },
            relations: ["organization"],
        });
        return {
            message: "User organization updated successfully",
            user: updatedUser,
            organization,
        };
    }

    async updateUserImage(payload: UpdateUserImageDto) {
        const user = await this.userRepository.findOne({
            where: { id: payload.userId },
        });

        if (!user) {
            throw new NotFoundException(
                `User with ID ${payload.userId} not found`,
            );
        }

        await this.userRepository.update(
            { id: payload.userId },
            { image: payload.image },
        );

        const updatedUser = await this.userRepository.findOne({
            where: { id: payload.userId },
        });

        return {
            message: "User image updated successfully",
            user: updatedUser,
        };
    }

    async updateUserImageByEmail(
        email: string,
        payload: UpdateUserImageByEmailDto,
    ): Promise<object> {
        const user = await this.userRepository.findOne({
            where: { email },
        });

        if (!user) {
            throw new NotFoundException(`User with email ${email} not found`);
        }

        await this.userRepository.update(
            { id: user.id },
            { image: payload.image },
        );

        const updatedUser = await this.userRepository.findOne({
            where: { id: user.id },
        });

        return {
            message: "User image updated successfully",
            user: updatedUser,
        };
    }
}
