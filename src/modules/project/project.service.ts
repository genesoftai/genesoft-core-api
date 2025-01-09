import {
    Inject,
    Injectable,
    Logger,
    LoggerService,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Project } from "./entity/project.entity";
import { CreateProjectDto } from "./dto/create-project.dto";
import { Page } from "./entity/page.entity";
import { Branding } from "./entity/branding.entity";
import { Feature } from "./entity/feature.entity";
import { WebApplication } from "./entity/web-application.entity";
import { Feedback } from "./entity/feedback.entity";
import { File } from "@modules/metadata/entity/file.entity";
import {
    UpdateProjectDto,
    BrandingDto,
    FeatureDto,
    PageDto,
} from "./dto/update-project.dto";
import { ReferenceLink } from "@modules/metadata/entity/reference-link.entity";
import { getS3FileUrl } from "@/utils/aws/s3";

import { FileWithUrl } from "./type/file";
import { AWSConfigurationService } from "../configuration/aws";
import { GithubRepository } from "../github/entity/github-repository.entity";

@Injectable()
export class ProjectService {
    private readonly serviceName = "ProjectService";

    constructor(
        @Inject(Logger)
        private readonly logger: LoggerService,
        @InjectRepository(Project)
        private projectRepository: Repository<Project>,
        @InjectRepository(Branding)
        private brandingRepository: Repository<Branding>,
        @InjectRepository(Page)
        private pageRepository: Repository<Page>,
        @InjectRepository(Feature)
        private featureRepository: Repository<Feature>,
        @InjectRepository(WebApplication)
        private webApplicationRepository: Repository<WebApplication>,
        @InjectRepository(GithubRepository)
        private githubRepoRepository: Repository<GithubRepository>,
        @InjectRepository(Feedback)
        private feedbackRepository: Repository<Feedback>,
        @InjectRepository(File)
        private fileRepository: Repository<File>,
        @InjectRepository(ReferenceLink)
        private referenceLinkRepository: Repository<ReferenceLink>,
        private awsConfigurationService: AWSConfigurationService,
    ) {
        this.logger.log({
            message: `${this.serviceName}.constructor: Service initialized`,
            metadata: { timestamp: new Date() },
        });
    }

    async getAllProjects(): Promise<Project[]> {
        this.logger.log({
            message: `${this.serviceName}.getAllProjects: Fetching all projects`,
            metadata: { timestamp: new Date() },
        });
        const projects = await this.projectRepository.find();
        this.logger.log({
            message: `${this.serviceName}.getAllProjects: Retrieved projects`,
            metadata: { count: projects.length, timestamp: new Date() },
        });
        return projects;
    }

    async getProjectById(id: string): Promise<Project> {
        this.logger.log({
            message: `${this.serviceName}.getProjectById: Fetching project`,
            metadata: { id, timestamp: new Date() },
        });

        // Get the base project
        const project = await this.projectRepository.findOne({
            where: { id },
        });

        if (!project) {
            this.logger.warn({
                message: `${this.serviceName}.getProjectById: Project not found`,
                metadata: { id, timestamp: new Date() },
            });
            throw new NotFoundException(`Project with id ${id} not found`);
        }

        // Get related records using project_id
        const [
            branding,
            pages,
            features,
            webApplications,
            githubRepos,
            feedbacks,
        ] = await Promise.all([
            this.brandingRepository.findOne({ where: { projectId: id } }),
            this.pageRepository.find({ where: { project_id: id } }),
            this.featureRepository.find({ where: { project_id: id } }),
            this.webApplicationRepository.find({ where: { project_id: id } }),
            this.githubRepoRepository.find({ where: { project_id: id } }),
            this.feedbackRepository.find({ where: { project_id: id } }),
        ]);

        // Combine all data
        const projectWithRelations = {
            ...project,
            branding,
            pages,
            features,
            web_applications: webApplications,
            github_repositories: githubRepos,
            feedbacks,
        };

        this.logger.log({
            message: `${this.serviceName}.getProjectById: Project found`,
            metadata: {
                id,
                name: project.name,
                timestamp: new Date(),
            },
        });

        return projectWithRelations;
    }

    async getProjectInfo(id: string): Promise<Project> {
        const project = await this.projectRepository.findOne({
            where: { id },
            select: [
                "id",
                "name",
                "description",
                "purpose",
                "target_audience",
                "created_at",
                "updated_at",
            ],
        });

        if (!project) {
            this.logger.warn({
                message: `${this.serviceName}.getProjectInfo: Project not found`,
                metadata: { id, timestamp: new Date() },
            });
            throw new NotFoundException(`Project with id ${id} not found`);
        }

        return project;
    }

    async getProjectPages(id: string): Promise<Page[]> {
        const pages = await this.pageRepository.find({
            where: { project_id: id },
            order: { created_at: "DESC" },
        });

        return pages;
    }

    async getProjectFeatures(id: string): Promise<Feature[]> {
        const features = await this.featureRepository.find({
            where: { project_id: id },
            order: { created_at: "DESC" },
        });

        return features;
    }

    async getProjectBranding(id: string): Promise<Branding> {
        const branding = await this.brandingRepository.findOne({
            where: { projectId: id },
        });

        if (!branding) {
            this.logger.warn({
                message: `${this.serviceName}.getProjectBranding: Branding not found`,
                metadata: { id, timestamp: new Date() },
            });
            throw new NotFoundException(`Branding for project ${id} not found`);
        }

        return branding;
    }

    async createProject(payload: CreateProjectDto): Promise<Project> {
        this.logger.log({
            message: `${this.serviceName}.createProject: Creating new project`,
            metadata: { payload, timestamp: new Date() },
        });

        // Create project with base fields
        const newProject = this.projectRepository.create({
            organization_id: payload.organization_id,
            name: payload.name,
            description: payload.description,
            purpose: payload.purpose,
            target_audience: payload.target_audience,
        });

        const project = await this.projectRepository.save(newProject);

        // Create and associate branding if provided
        if (payload.branding) {
            const brandingEntity = new Branding();
            brandingEntity.logo_url = payload.branding.logo_url;
            brandingEntity.color = payload.branding.color;
            brandingEntity.theme = payload.branding.theme;
            brandingEntity.perception = payload.branding.perception;
            brandingEntity.projectId = project.id;
            const savedBranding =
                await this.brandingRepository.save(brandingEntity);
            await this.projectRepository.update(project.id, {
                branding_id: savedBranding.id,
            });
        }

        // Create and associate pages if provided
        if (payload.pages) {
            for (const pageDto of payload.pages) {
                const pageEntity = new Page();
                pageEntity.name = pageDto.name;
                pageEntity.description = pageDto.description;
                pageEntity.file_ids = pageDto.file_ids;
                pageEntity.reference_link_ids = pageDto.reference_link_ids;
                pageEntity.project_id = project.id;
                const page = await this.pageRepository.save(pageEntity);
                this.logger.log({
                    message: `${this.serviceName}.createProject: Page created`,
                    metadata: {
                        pageId: pageEntity.id,
                        timestamp: new Date(),
                        page,
                    },
                });
            }
        }

        // Create and associate features if provided
        if (payload.features) {
            for (const featureDto of payload.features) {
                const featureEntity = new Feature();
                featureEntity.name = featureDto.name;
                featureEntity.description = featureDto.description;
                featureEntity.file_ids = featureDto.file_ids;
                featureEntity.reference_link_ids =
                    featureDto.reference_link_ids;
                featureEntity.project_id = project.id;
                const feature =
                    await this.featureRepository.save(featureEntity);
                this.logger.log({
                    message: `${this.serviceName}.createProject: Feature created`,
                    metadata: {
                        featureId: featureEntity.id,
                        timestamp: new Date(),
                        feature,
                    },
                });
            }
        }

        this.logger.log({
            message: `${this.serviceName}.createProject: Project created`,
            metadata: {
                projectId: project.id,
                timestamp: new Date(),
            },
        });

        return this.getProjectById(project.id);
    }

    async updateProjectInfo(
        id: string,
        payload: UpdateProjectDto,
    ): Promise<Project> {
        this.logger.log({
            message: `${this.serviceName}.updateProject: Updating project`,
            metadata: { id, payload, timestamp: new Date() },
        });

        await this.projectRepository.update(id, {
            name: payload.name,
            description: payload.description,
            purpose: payload.purpose,
            target_audience: payload.target_audience,
        });

        const updated = await this.getProjectById(id);

        this.logger.log({
            message: `${this.serviceName}.updateProject: Project updated`,
            metadata: { id, timestamp: new Date() },
        });
        return updated;
    }
    async updateBranding(id: string, payload: BrandingDto): Promise<Project> {
        this.logger.log({
            message: `${this.serviceName}.updateBranding: Updating project branding`,
            metadata: { id, brandingData: payload, timestamp: new Date() },
        });

        const existingBranding = await this.brandingRepository.findOne({
            where: { projectId: id },
        });

        if (!existingBranding) {
            await this.brandingRepository.insert({
                projectId: id,
                logo_url: payload.logo_url,
                color: payload.color,
                theme: payload.theme,
                perception: payload.perception,
            });

            const newBranding = await this.brandingRepository.findOne({
                where: { projectId: id },
            });

            await this.projectRepository.update(id, {
                branding_id: newBranding.id,
            });
        } else {
            await this.brandingRepository.update(
                { projectId: id },
                {
                    logo_url: payload.logo_url,
                    color: payload.color,
                    theme: payload.theme,
                    perception: payload.perception,
                },
            );
        }

        this.logger.log({
            message: `${this.serviceName}.updateBranding: Branding updated`,
            metadata: {
                id,
                timestamp: new Date(),
            },
        });

        return this.getProjectById(id);
    }

    async addPage(id: string, payload: PageDto): Promise<Project> {
        this.logger.log({
            message: `${this.serviceName}.addPage: Adding page`,
            metadata: { id, pageData: payload, timestamp: new Date() },
        });

        const pageEntity = new Page();
        pageEntity.name = payload.name;
        pageEntity.description = payload.description;
        pageEntity.file_ids = payload.file_ids;
        pageEntity.reference_link_ids = payload.reference_link_ids;
        pageEntity.project_id = id;

        const page = await this.pageRepository.save(pageEntity);

        this.logger.log({
            message: `${this.serviceName}.addPage: Page added`,
            metadata: {
                pageId: page.id,
                projectId: id,
                timestamp: new Date(),
            },
        });

        return this.getProjectById(id);
    }

    async addFeature(id: string, payload: FeatureDto): Promise<Project> {
        this.logger.log({
            message: `${this.serviceName}.addFeature: Adding feature`,
            metadata: {
                id,
                featureData: payload,
                timestamp: new Date(),
            },
        });

        const featureEntity = new Feature();
        featureEntity.name = payload.name;
        featureEntity.description = payload.description;
        featureEntity.file_ids = payload.file_ids;
        featureEntity.reference_link_ids = payload.reference_link_ids;
        featureEntity.project_id = id;

        const feature = await this.featureRepository.save(featureEntity);

        this.logger.log({
            message: `${this.serviceName}.addFeature: Feature added`,
            metadata: {
                featureId: feature.id,
                projectId: id,
                timestamp: new Date(),
            },
        });

        return this.getProjectById(id);
    }

    async updatePage(id: string, payload: PageDto): Promise<Page> {
        this.logger.log({
            message: `${this.serviceName}.updatePage: Updating page`,
            metadata: { id, pageData: payload, timestamp: new Date() },
        });

        try {
            const page = await this.pageRepository.findOne({ where: { id } });
            if (!page) {
                throw new NotFoundException(`Page not found`);
            }

            await this.pageRepository.update(id, {
                ...payload,
            });

            return this.pageRepository.findOne({ where: { id } });
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.updatePage: Error to update page`,
                metadata: { id, error, timestamp: new Date() },
            });
            throw error;
        }
    }

    async updateFeature(id: string, payload: FeatureDto): Promise<Feature> {
        this.logger.log({
            message: `${this.serviceName}.updateFeature: Updating feature`,
            metadata: { id, featureData: payload, timestamp: new Date() },
        });

        try {
            const feature = await this.featureRepository.findOne({
                where: { id },
            });
            if (!feature) {
                throw new NotFoundException(`Feature not found`);
            }

            await this.featureRepository.update(id, {
                ...payload,
            });

            return this.featureRepository.findOne({ where: { id } });
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.updateFeature: Error to update feature`,
                metadata: { id, error, timestamp: new Date() },
            });
            throw error;
        }
    }

    async deletePage(id: string): Promise<void> {
        this.logger.log({
            message: `${this.serviceName}.deletePage: Deleting page`,
            metadata: { id, timestamp: new Date() },
        });

        const page = await this.pageRepository.findOne({ where: { id } });
        if (!page) {
            throw new NotFoundException(`Page with id ${id} not found`);
        }

        await this.pageRepository.delete(id);

        this.logger.log({
            message: `${this.serviceName}.deletePage: Page deleted`,
            metadata: { id, timestamp: new Date() },
        });
    }

    async deleteFeature(id: string): Promise<void> {
        this.logger.log({
            message: `${this.serviceName}.deleteFeature: Deleting feature`,
            metadata: { id, timestamp: new Date() },
        });

        const feature = await this.featureRepository.findOne({ where: { id } });
        if (!feature) {
            throw new NotFoundException(`Feature with id ${id} not found`);
        }

        await this.featureRepository.delete(id);

        this.logger.log({
            message: `${this.serviceName}.deleteFeature: Feature deleted`,
            metadata: { id, timestamp: new Date() },
        });
    }

    async deleteProject(id: string): Promise<void> {
        this.logger.log({
            message: `${this.serviceName}.deleteProject: Deleting project`,
            metadata: { id, timestamp: new Date() },
        });

        await this.projectRepository.delete(id);

        this.logger.log({
            message: `${this.serviceName}.deleteProject: Project deleted`,
            metadata: { id, timestamp: new Date() },
        });
    }

    async getPageFiles(id: string): Promise<FileWithUrl[]> {
        const page = await this.pageRepository.findOne({ where: { id } });
        const files = await this.fileRepository.find({
            where: { id: In(page.file_ids) },
            order: { created_at: "DESC" },
        });
        return files.map((file) => ({
            ...file,
            url: getS3FileUrl(
                this.awsConfigurationService.awsS3BucketName,
                this.awsConfigurationService.awsRegion,
                file.path,
            ),
        }));
    }

    async getPageReferenceLinks(id: string): Promise<ReferenceLink[]> {
        const page = await this.pageRepository.findOne({ where: { id } });
        const referenceLinks = await this.referenceLinkRepository.find({
            where: { id: In(page.reference_link_ids) },
            order: { created_at: "DESC" },
        });
        return referenceLinks;
    }

    async getFeatureFiles(id: string): Promise<FileWithUrl[]> {
        const feature = await this.featureRepository.findOne({
            where: { id },
        });
        const files = await this.fileRepository.find({
            where: { id: In(feature.file_ids) },
        });
        return files.map((file) => ({
            ...file,
            url: getS3FileUrl(
                this.awsConfigurationService.awsS3BucketName,
                this.awsConfigurationService.awsRegion,
                file.path,
            ),
        }));
    }

    async getFeatureReferenceLinks(id: string): Promise<ReferenceLink[]> {
        const feature = await this.featureRepository.findOne({ where: { id } });
        const referenceLinks = await this.referenceLinkRepository.find({
            where: { id: In(feature.reference_link_ids) },
        });
        return referenceLinks;
    }
}
