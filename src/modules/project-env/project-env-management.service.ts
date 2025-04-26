import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProjectEnv } from "./entity/project-env.entity";
import {
    CreateProjectEnvDto,
    UpdateProjectEnvDto,
    ProjectEnvResponseDto,
} from "../project/dto/project-env.dto";
import * as crypto from "crypto";
import { FrontendInfraService } from "../frontend-infra/frontend-infra.service";
import { Project } from "../project/entity/project.entity";
import { CodesandboxService } from "../codesandbox/codesandbox.service";

@Injectable()
export class ProjectEnvManagementService {
    private readonly algorithm = "aes-256-gcm";
    private readonly key = Buffer.from(
        process.env.PROJECT_ENV_KEY || "",
        "hex",
    );

    constructor(
        @InjectRepository(ProjectEnv)
        private readonly projectEnvRepository: Repository<ProjectEnv>,
        private frontendInfraService: FrontendInfraService,
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,
        private readonly codesandboxService: CodesandboxService,
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

    private async isWebProject(projectId: string): Promise<boolean> {
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
        });

        if (!project) {
            return false;
        }

        // Check if project_template_type starts with "web_"
        return project.project_template_type?.startsWith("web_") || false;
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

        // Sync with Vercel if it's a web project
        const isWeb = await this.isWebProject(projectId);
        if (isWeb) {
            await this.frontendInfraService.addOneEnvironmentVariableToVercelProject(
                {
                    project_id: projectId,
                    environment_variable: {
                        key: dto.key,
                        value: dto.value,
                        type: "plain",
                        target: ["preview"],
                        gitBranch: "dev",
                    },
                },
            );
        }

        const allEnvs = await this.findAll(projectId);
        const envs = allEnvs.map((env) => `${env.key}=${env.value}`).join("\n");
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
        });

        this.codesandboxService.writeFileOnSandbox({
            sandbox_id: project.sandbox_id,
            path: ".env",
            content: envs,
        });

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

        // Sync with Vercel if it's a web project and value has changed
        const isWeb = await this.isWebProject(projectId);
        if (isWeb && dto.value !== undefined) {
            await this.frontendInfraService.addOneEnvironmentVariableToVercelProject(
                {
                    project_id: projectId,
                    environment_variable: {
                        key: env.key,
                        value: dto.value,
                        type: "plain",
                        target: ["preview"],
                        gitBranch: "dev",
                    },
                },
            );
        }

        // TODO: update .env file on codesandbox with new set of values
        const allEnvs = await this.findAll(projectId);
        const envs = allEnvs.map((env) => `${env.key}=${env.value}`).join("\n");
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
        });

        this.codesandboxService.writeFileOnSandbox({
            sandbox_id: project.sandbox_id,
            path: ".env",
            content: envs,
        });

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
        const env = await this.projectEnvRepository.findOne({
            where: { id, projectId },
        });

        if (!env) {
            throw new NotFoundException(
                `Environment variable with id ${id} not found`,
            );
        }

        // Get the key before deletion for Vercel sync
        const key = env.key;

        const result = await this.projectEnvRepository.delete({
            id,
            projectId,
        });

        if (result.affected === 0) {
            throw new NotFoundException(
                `Environment variable with id ${id} not found`,
            );
        }

        // If web project, we would need to delete from Vercel too
        // Note: Current FrontendInfraService API doesn't have a method to delete a single env var
        // This is a limitation and would require extending the FrontendInfraService
        const isWeb = await this.isWebProject(projectId);
        if (isWeb) {
            // As a workaround, we could set the value to an empty string
            await this.frontendInfraService.addOneEnvironmentVariableToVercelProject(
                {
                    project_id: projectId,
                    environment_variable: {
                        key: key,
                        value: "", // Set to empty
                        type: "plain",
                        target: ["preview"],
                        gitBranch: "dev",
                    },
                },
            );
        }
    }
}
