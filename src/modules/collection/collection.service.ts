import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Collection } from "./entity/collection.entity";
import { Repository } from "typeorm";
import { CreateCollectionDto } from "./dto/create-collection.dto";
import { Project } from "../project/entity/project.entity";
import { ProjectTemplateTypeInProjectTable } from "../constants/project";
import { GithubRepository } from "../github/entity/github-repository.entity";

@Injectable()
export class CollectionService {
    private serviceName = "CollectionService";
    private logger = new Logger(this.serviceName);

    constructor(
        @InjectRepository(Collection)
        private collectionRepository: Repository<Collection>,
        @InjectRepository(Project)
        private projectRepository: Repository<Project>,
        @InjectRepository(GithubRepository)
        private githubRepositoryRepository: Repository<GithubRepository>,
    ) {}

    async createCollection(payload: CreateCollectionDto): Promise<Collection> {
        try {
            const collection = this.collectionRepository.create(payload);
            return this.collectionRepository.save(collection);
        } catch (error) {
            this.logger.error("Failed to create collection", error.stack);
            throw error;
        }
    }

    async getCollection(id: string): Promise<Collection> {
        try {
            return await this.collectionRepository.findOne({ where: { id } });
        } catch (error) {
            this.logger.error("Failed to get collection", error.stack);
            throw error;
        }
    }

    async updateCollection(
        id: string,
        payload: Partial<Collection>,
    ): Promise<Collection> {
        try {
            await this.collectionRepository.update(id, payload);
            return await this.getCollection(id);
        } catch (error) {
            this.logger.error("Failed to update collection", error.stack);
            throw error;
        }
    }

    async deleteCollection(id: string): Promise<void> {
        try {
            await this.collectionRepository.delete(id);
        } catch (error) {
            this.logger.error("Failed to delete collection", error.stack);
            throw error;
        }
    }

    async getCollectionByWebProjectId(
        webProjectId: string,
    ): Promise<Collection> {
        try {
            return this.collectionRepository.findOne({
                where: { web_project_id: webProjectId },
            });
        } catch (error) {
            this.logger.error(
                "Failed to get collection by web project id",
                error.stack,
            );
            throw error;
        }
    }

    async getBackendProjectForWebProject(
        webProjectId: string,
    ): Promise<{ backendProject: Project; repository: GithubRepository }> {
        const collection = await this.collectionRepository.findOne({
            where: { web_project_id: webProjectId },
        });
        if (!collection) {
            throw new Error("Collection not found");
        }
        const backendProjectIds = Array.isArray(
            collection.backend_service_project_ids,
        )
            ? collection.backend_service_project_ids
            : [];
        if (backendProjectIds.length === 0) {
            throw new Error("Backend project id not found");
        }
        const projectId = backendProjectIds[0];
        const backendProject = await this.projectRepository.findOne({
            where: {
                id: projectId,
            },
        });
        if (!backendProject) {
            throw new Error("Backend project not found");
        }
        const repository = await this.githubRepositoryRepository.findOne({
            where: {
                project_id: projectId,
            },
        });
        if (!repository) {
            throw new Error("Repository not found");
        }
        return {
            backendProject,
            repository,
        };
    }

    async getAvailableWebProjectsForOrganization(
        organizationId: string,
    ): Promise<Project[]> {
        const collections = await this.collectionRepository.find({
            where: { organization_id: organizationId },
        });

        this.logger.log({
            message: `Collections`,
            metadata: {
                collections,
            },
        });

        const unavailableWebProjectIds = collections
            .map((collection) => collection.web_project_id)
            .filter((id) => id !== null);

        this.logger.log({
            message: `Unavailable web project ids`,
            metadata: {
                unavailableWebProjectIds,
            },
        });

        const webProjects = await this.projectRepository.find({
            where: {
                organization_id: organizationId,
                project_template_type:
                    ProjectTemplateTypeInProjectTable.WebNextJs,
            },
            order: {
                created_at: "DESC",
            },
        });

        this.logger.log({
            message: `Web projects`,
            metadata: {
                webProjects,
            },
        });
        return webProjects.filter(
            (webProject) => !unavailableWebProjectIds.includes(webProject.id),
        );
    }

    async changeWebProjectInCollection(
        collectionId: string,
        webProjectId: string,
    ): Promise<Collection> {
        try {
            return this.updateCollection(collectionId, {
                web_project_id: webProjectId,
            });
        } catch (error) {
            this.logger.error("Failed to add web into collection", error.stack);
            throw error;
        }
    }

    async removeWebProjectFromCollection(
        collectionId: string,
    ): Promise<Collection> {
        try {
            return this.updateCollection(collectionId, {
                web_project_id: null,
            });
        } catch (error) {
            this.logger.error(
                "Failed to remove web project from collection",
                error.stack,
            );
            throw error;
        }
    }

    async addBackendIntoCollection(
        collectionId: string,
        backendProjectId: string,
    ): Promise<Collection> {
        try {
            const collection = await this.getCollection(collectionId);
            if (!collection) {
                throw new Error("Collection not found");
            }
            this.logger.log({
                message: `Adding backend ${backendProjectId} to collection ${collectionId}`,
                collection,
                backendProjectId,
            });

            // Ensure backend_service_project_ids is an array before spreading
            const backendServiceProjectIds = Array.isArray(
                collection.backend_service_project_ids,
            )
                ? collection.backend_service_project_ids
                : [];

            return this.updateCollection(collectionId, {
                backend_service_project_ids: [
                    ...backendServiceProjectIds,
                    backendProjectId,
                ],
            });
        } catch (error) {
            this.logger.error(
                "Failed to add backend into collection",
                error.stack,
            );
            throw error;
        }
    }

    async removeBackendFromCollection(
        collectionId: string,
        backendProjectId: string,
    ): Promise<Collection> {
        try {
            const collection = await this.getCollection(collectionId);
            if (!collection) {
                throw new Error("Collection not found");
            }
            return this.updateCollection(collectionId, {
                backend_service_project_ids:
                    collection.backend_service_project_ids.filter(
                        (id) => id !== backendProjectId,
                    ),
            });
        } catch (error) {
            this.logger.error(
                "Failed to remove backend from collection",
                error.stack,
            );
            throw error;
        }
    }
}
