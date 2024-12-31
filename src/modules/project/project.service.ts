import {
    Inject,
    Injectable,
    Logger,
    LoggerService,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Project } from "./entity/project.entity";
import { CreateProjectDto } from "./dto/create-project.dto";
import { Page } from "./entity/page.entity";
import { Branding } from "./entity/branding.entity";
import { Feature } from "./entity/feature.entity";
import { WebApplication } from "./entity/web-application.entity";
import { Github } from "./entity/github.entity";
import { Feedback } from "./entity/feedback.entity";

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
        @InjectRepository(Github)
        private githubRepoRepository: Repository<Github>,
        @InjectRepository(Feedback)
        private feedbackRepository: Repository<Feedback>,
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
            github_repos: githubRepos,
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
            brandingEntity.logoUrl = payload.branding.logo_url;
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

    async updateProject(
        id: string,
        payload: Partial<Project>,
    ): Promise<Project> {
        this.logger.log({
            message: `${this.serviceName}.updateProject: Updating project`,
            metadata: { id, payload, timestamp: new Date() },
        });

        await this.projectRepository.update(id, payload);
        const updated = await this.getProjectById(id);

        this.logger.log({
            message: `${this.serviceName}.updateProject: Project updated`,
            metadata: { id, timestamp: new Date() },
        });
        return updated;
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
}
