import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProjectEnv } from "./entity/project-env.entity";
import {
    CreateProjectEnvDto,
    UpdateProjectEnvDto,
    ProjectEnvResponseDto,
} from "./dto/project-env.dto";
import * as crypto from "crypto";

@Injectable()
export class ProjectEnvManagementService {
    private readonly algorithm = "aes-256-gcm";
    private readonly key = Buffer.from(process.env.ENCRYPTION_KEY || "", "hex");

    constructor(
        @InjectRepository(ProjectEnv)
        private readonly projectEnvRepository: Repository<ProjectEnv>,
    ) {}

    private encrypt(text: string): string {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        let encrypted = cipher.update(text, "utf8", "hex");
        encrypted += cipher.final("hex");
        const authTag = cipher.getAuthTag();
        return `${iv.toString("hex")}:${encrypted}:${authTag.toString("hex")}`;
    }

    private decrypt(encryptedData: string): string {
        const [ivHex, encrypted, authTagHex] = encryptedData.split(":");
        const iv = Buffer.from(ivHex, "hex");
        const authTag = Buffer.from(authTagHex, "hex");
        const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    }

    async create(
        projectId: string,
        dto: CreateProjectEnvDto,
    ): Promise<ProjectEnvResponseDto> {
        const encryptedValue = this.encrypt(dto.value);
        const env = this.projectEnvRepository.create({
            projectId,
            key: dto.key,
            encryptedValue,
            isSecret: dto.isSecret ?? false,
        });

        const savedEnv = await this.projectEnvRepository.save(env);
        return {
            ...savedEnv,
            value: dto.value,
        };
    }

    async update(
        id: string,
        projectId: string,
        dto: UpdateProjectEnvDto,
    ): Promise<ProjectEnvResponseDto> {
        const env = await this.projectEnvRepository.findOne({
            where: { id, projectId },
        });
        if (!env) {
            throw new NotFoundException(
                `Environment variable with id ${id} not found`,
            );
        }

        if (dto.value !== undefined) {
            env.encryptedValue = this.encrypt(dto.value);
        }
        if (dto.isSecret !== undefined) {
            env.isSecret = dto.isSecret;
        }

        const savedEnv = await this.projectEnvRepository.save(env);
        return {
            ...savedEnv,
            value:
                dto.value !== undefined
                    ? dto.value
                    : this.decrypt(env.encryptedValue),
        };
    }

    async findAll(projectId: string): Promise<ProjectEnvResponseDto[]> {
        const envs = await this.projectEnvRepository.find({
            where: { projectId },
        });
        return envs.map((env) => ({
            ...env,
            value: this.decrypt(env.encryptedValue),
        }));
    }

    async findOne(
        id: string,
        projectId: string,
    ): Promise<ProjectEnvResponseDto> {
        const env = await this.projectEnvRepository.findOne({
            where: { id, projectId },
        });
        if (!env) {
            throw new NotFoundException(
                `Environment variable with id ${id} not found`,
            );
        }

        return {
            ...env,
            value: this.decrypt(env.encryptedValue),
        };
    }

    async remove(id: string, projectId: string): Promise<void> {
        const result = await this.projectEnvRepository.delete({
            id,
            projectId,
        });
        if (result.affected === 0) {
            throw new NotFoundException(
                `Environment variable with id ${id} not found`,
            );
        }
    }
}
