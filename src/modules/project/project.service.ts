import {
    BadRequestException,
    forwardRef,
    Inject,
    Injectable,
    Logger,
    LoggerService,
    NotFoundException,
    OnModuleInit,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, MoreThan, Repository } from "typeorm";
import { Project } from "./entity/project.entity";
import {
    CreateProjectDto,
    CreateProjectFromOnboardingDto,
} from "./dto/create-project.dto";
import { Page } from "./entity/page.entity";
import { Branding } from "./entity/branding.entity";
import { Feature } from "./entity/feature.entity";
import { WebApplication } from "./entity/web-application.entity";
import { Feedback } from "../feedback/entity/feedback.entity";
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
import { ProjectTemplateName, ProjectTemplateType } from "../constants/project";
import { GithubService } from "../github/github.service";
import {
    formatBasicInfo,
    formatBranding,
    formatFeatures,
    formatPages,
} from "@/utils/project/documentation";
import { Iteration } from "../development/entity/iteration.entity";
import { KoyebProject } from "@/modules/backend-infra/entity/koyeb-project.entity";
import { Supabase } from "../supabase/entity/supabase.entity";
import { VercelProject } from "@/modules/frontend-infra/entity/vercel-project.entity";
import { BackendInfraService } from "@/modules/backend-infra/backend-infra.service";
import { FrontendInfraService } from "@/modules/frontend-infra/frontend-infra.service";
import { SupabaseService } from "../supabase/supabase.service";
import { DevelopmentService } from "../development/development.service";
import { UserService } from "../user/user.service";
import { OrganizationService } from "../organization/organization.service";
import { OrganizationRole } from "../constants/organization";
import { SystemId } from "../constants/agent";
import { ConversationService } from "@/conversation/conversation.service";
import { Conversation } from "@/conversation/entity/conversation.entity";
import { CodesandboxService } from "../codesandbox/codesandbox.service";
import { CodesandboxTemplateId } from "../constants/codesandbox";
import { LlmService } from "../llm/llm.service";
import { IterationType } from "../constants/development";
import { ProjectDbManagerService } from "../project-db/project-db-manager.service";
import { GetProjectsDto } from "./dto/get-project.dto";
import { Collection } from "../collection/entity/collection.entity";
import { CollectionService } from "../collection/collection.service";

@Injectable()
export class ProjectService implements OnModuleInit {
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
        private githubService: GithubService,
        @InjectRepository(Iteration)
        private iterationRepository: Repository<Iteration>,
        @InjectRepository(Supabase)
        private supabaseRepository: Repository<Supabase>,
        @InjectRepository(VercelProject)
        private vercelProjectRepository: Repository<VercelProject>,
        @InjectRepository(KoyebProject)
        private koyebProjectRepository: Repository<KoyebProject>,
        private supabaseService: SupabaseService,
        private frontendInfraService: FrontendInfraService,
        private backendInfraService: BackendInfraService,
        @Inject(forwardRef(() => DevelopmentService))
        private developmentService: DevelopmentService,
        private userService: UserService,
        @Inject(forwardRef(() => OrganizationService))
        private organizationService: OrganizationService,
        @Inject(forwardRef(() => ConversationService))
        private conversationService: ConversationService,
        @InjectRepository(Conversation)
        private conversationRepository: Repository<Conversation>,
        private codesandboxService: CodesandboxService,
        private llmService: LlmService,
        private projectDbManagerService: ProjectDbManagerService,
        private collectionService: CollectionService,
    ) {
        this.logger.log({
            message: `${this.serviceName}.constructor: Service initialized`,
            metadata: { timestamp: new Date() },
        });
    }

    async onModuleInit() {
        this.logger.log({
            message: `${this.serviceName}.onModuleInit: Service initialized`,
        });

        // this.requestGithubAccess(
        //     "5858afc6-ebe9-4cb5-8e52-59b3d0e51bb6",
        //     "6fa8fb9c-86c6-4bf0-8f4e-7a2e40c4c788",
        // );
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
            this.pageRepository.find({
                where: { project_id: id },
                order: { created_at: "ASC" },
            }),
            this.featureRepository.find({
                where: { project_id: id },
                order: { created_at: "ASC" },
            }),
            this.webApplicationRepository.find({
                where: { project_id: id },
                order: { created_at: "ASC" },
            }),
            this.githubRepoRepository.find({
                where: { project_id: id },
                order: { created_at: "ASC" },
            }),
            this.feedbackRepository.find({
                where: { project_id: id },
                order: { created_at: "ASC" },
            }),
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

    async getProjectInfrastructure(id: string) {
        const project = await this.projectRepository.findOne({
            where: { id },
        });

        if (!project) {
            throw new NotFoundException(`Project with id ${id} not found`);
        }

        const supabase = await this.supabaseRepository.findOne({
            where: { project_id: id },
        });

        const vercel = await this.vercelProjectRepository.findOne({
            where: { project_id: id },
        });

        const koyeb = await this.koyebProjectRepository.findOne({
            where: { project_id: id },
        });

        // Get database disk usage
        const dbDiskUsage = await this.projectDbManagerService.getDatabaseDiskUsage(id);

        return {
            project,
            supabase,
            vercel,
            koyeb,
            dbDiskUsage,
        };
    }

    async getProjectInfo(id: string): Promise<object> {
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
                "project_template_type",
                "backend_requirements",
            ],
        });
        const pages = await this.getProjectPages(id);
        const features = await this.getProjectFeatures(id);
        const branding = await this.getProjectBranding(id);

        if (!project) {
            this.logger.warn({
                message: `${this.serviceName}.getProjectInfo: Project not found`,
                metadata: { id, timestamp: new Date() },
            });
            throw new NotFoundException(`Project with id ${id} not found`);
        }

        return { ...project, pages, features, branding };
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

    async getProjectBranding(id: string): Promise<Branding | object> {
        const branding = await this.brandingRepository.findOne({
            where: { projectId: id },
        });

        if (!branding) {
            return {};
        }

        return branding;
    }

    async getProjectsByIds(query: string): Promise<Project[]> {
        if (query) {
            const ids = query.split(",");
            try {
                return await this.projectRepository.find({
                    where: { id: In(ids) },
                    order: { created_at: "ASC" },
                });
            } catch (error) {
                this.logger.error("Failed to get projects by ids", error.stack);
                throw error;
            }
        } else {
            return [];
        }
    }

    async createProject(
        payload: CreateProjectDto,
    ): Promise<Project | { webProject: Project; backendProject: Project }> {
        this.logger.log({
            message: `${this.serviceName}.createProject: Creating new project`,
            metadata: { payload, timestamp: new Date() },
        });

        if (payload.project_type === ProjectTemplateType.Web) {
            // Create web only project
            return this.createWebProject(payload);
        } else if (payload.project_type === ProjectTemplateType.WebAndBackend) {
            // Create web and backend project
            return this.createWebAndBackendProject(payload);
        } else if (payload.project_type === ProjectTemplateType.Backend) {
            // Create backend only project
            return this.createBackendProject(payload);
        } else {
            throw new BadRequestException(
                `Invalid project type: ${payload.project_type}`,
            );
        }
    }

    async createWebProject(payload: CreateProjectDto): Promise<Project> {
        // Create project with base fields
        const newProject = this.projectRepository.create({
            organization_id: payload.organization_id,
            name: payload.name,
            description: payload.description,
            purpose: payload.purpose,
            target_audience: payload.target_audience,
            project_template_type: "web_nextjs",
        });

        const project = await this.projectRepository.save(newProject);

        const sandboxName = `nextjs-web_${project.id}`;
        const sandbox = await this.codesandboxService.createSandbox({
            template: CodesandboxTemplateId.NewNextJsShadcn,
            title: sandboxName,
            description: `Next.js Shadcn project for ${sandboxName}`,
        });

        await this.projectRepository.update(project.id, {
            sandbox_id: sandbox.id,
        });

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

        const githubRepository =
            await this.githubService.createRepositoryFromTemplate({
                projectTemplateName: ProjectTemplateName.NextJsWeb,
                description: `NextJS (web) project for ${project.name}`,
                projectId: project.id,
            });

        this.logger.log({
            message: `${this.serviceName}.createWebProject: Project created`,
            metadata: {
                projectId: project.id,
                timestamp: new Date(),
            },
        });

        const vercelProject =
            await this.frontendInfraService.createNewVercelProject({
                project_id: project.id,
            });
        this.logger.log({
            message: `${this.serviceName}.createWebProject: Vercel project created`,
            metadata: { projectId: project.id, vercelProject },
        });

        // TODO: add api_doc.md to github repo to trigger deployment
        await this.githubService.updateRepositoryContent({
            repository: githubRepository.name,
            path: "api_doc.md",
            content: "# API documentation for the project",
            message: "Add api_doc.md to github repo",
            ref: "dev",
            branch: "dev",
            committer: {
                name: "khemmapichpanyana",
                email: "khemmapich@gmail.com",
            },
        });

        if (payload.is_create_iteration) {
            await this.developmentService.createIteration({
                project_id: project.id,
                type: IterationType.Project,
                sandbox_id: sandbox.id,
                project_template_type: ProjectTemplateType.Web,
            });
        }

        return project;
    }

    async createBackendProject(payload: CreateProjectDto): Promise<Project> {
        this.logger.log({
            message: `${this.serviceName}.createBackendProject: Creating new project`,
            metadata: { payload, timestamp: new Date() },
        });
        // Create web and backend project
        const newProject = this.projectRepository.create({
            organization_id: payload.organization_id,
            name: payload.name,
            description: payload.description,
            backend_requirements: payload.backend_requirements,
            project_template_type: "backend_nestjs",
        });

        const project = await this.projectRepository.save(newProject);

        const sandboxName = `nestjs-api_${project.id}`;
        const sandbox = await this.codesandboxService.createSandbox({
            template: CodesandboxTemplateId.NewNestJsApi,
            title: sandboxName,
            description: `Nest.js API project for ${sandboxName}`,
        });

        await this.projectRepository.update(project.id, {
            sandbox_id: sandbox.id,
        });

        const githubRepository =
            await this.githubService.createRepositoryFromTemplate({
                projectTemplateName: ProjectTemplateName.NestJsApi,
                description: `Nest.js API project for ${project.name}`,
                projectId: project.id,
            });

        this.logger.log({
            message: `${this.serviceName}.createBackendProject: Project created`,
            metadata: {
                projectId: project.id,
                timestamp: new Date(),
                githubRepository,
            },
        });

        if (payload.is_create_iteration) {
            await this.developmentService.createIteration({
                project_id: project.id,
                type: IterationType.Project,
                sandbox_id: sandbox.id,
                project_template_type: ProjectTemplateType.Backend,
            });
        }

        return project;
    }

    async createWebAndBackendProject(
        payload: CreateProjectDto,
    ): Promise<{ webProject: Project; backendProject: Project }> {
        const [webProject, backendProject] = await Promise.all([
            this.createWebProject({
                ...payload,
                is_create_iteration: false,
            }),
            this.createBackendProject({
                ...payload,
                is_create_iteration: false,
            }),
        ]);

        return { webProject, backendProject };
    }

    async createProjectFromOnboarding(payload: CreateProjectFromOnboardingDto) {
        try {
            this.logger.log({
                message: `${this.serviceName}.createProjectFromOnboarding: Creating project from onboarding`,
                metadata: { payload, timestamp: new Date() },
            });
            const user = await this.userService.getUserById(payload.user_id);
            const existingOrganization =
                await this.organizationService.getOrganizationsForUser(user.id);
            let organization;
            if (existingOrganization.length >= 1) {
                organization = existingOrganization[0];
            } else {
                organization =
                    await this.organizationService.createOrganization({
                        name: `${user.email}'s Organization`,
                        description: `Organization for onboarding ${user.email}`,
                        userEmail: user.email,
                    });
                await this.organizationService.addUserToOrganization({
                    userId: user.id,
                    organizationId: organization.id,
                    role: OrganizationRole.Owner,
                });
            }

            const projectName = await this.llmService.generateProjectName(
                payload.project_description,
                payload.backend_requirements,
            );

            if (payload.project_type === ProjectTemplateType.Web) {
                const project = await this.createWebProject({
                    name: projectName,
                    description: payload.project_description,
                    organization_id: organization.id,
                    project_type: payload.project_type,
                    branding: {
                        logo_url: payload.branding.logo_url,
                        color: payload.branding.color,
                    },
                    is_create_iteration: true,
                });
                const iteration = await this.iterationRepository.findOne({
                    where: { project_id: project.id },
                });

                const conversation = await this.conversationRepository.save({
                    project_id: project.id,
                    name: "Web Project Creation",
                    description: "Conversation about the web project creation",
                    user_id: SystemId.PageChannelSystemId,
                    status: "active",
                    iteration_id: iteration.id,
                });

                await this.conversationService.talkToProjectManager({
                    project_id: project.id,
                    conversation_id: conversation.id,
                    message: {
                        content: `Please update user with latest information about the project creation of ${project.name}`,
                        sender_type: "system",
                        message_type: "text",
                        sender_id: SystemId.GenesoftProjectManager,
                    },
                });
                return { project };
            } else if (payload.project_type === ProjectTemplateType.Backend) {
                const project = await this.createBackendProject({
                    name: projectName,
                    description: payload.project_description,
                    organization_id: organization.id,
                    project_type: payload.project_type,
                    backend_requirements: payload.backend_requirements,
                    is_create_iteration: true,
                });
                const iteration = await this.iterationRepository.findOne({
                    where: { project_id: project.id },
                });

                const conversation = await this.conversationRepository.save({
                    project_id: project.id,
                    name: "Backend Project Creation",
                    description:
                        "Conversation about the backend project creation",
                    user_id: SystemId.GenesoftProjectManager,
                    status: "active",
                    iteration_id: iteration.id,
                });

                await this.conversationService.talkToBackendDeveloper({
                    project_id: project.id,
                    conversation_id: conversation.id,
                    message: {
                        content: `Please update user with latest information about the project creation of ${project.name}`,
                        sender_type: "system",
                        message_type: "text",
                        sender_id: SystemId.GenesoftProjectManager,
                    },
                });
                return { project };
            } else if (
                payload.project_type === ProjectTemplateType.WebAndBackend
            ) {
                const { webProject, backendProject } =
                    await this.createWebAndBackendProject({
                        name: projectName,
                        description: payload.project_description,
                        organization_id: organization.id,
                        project_type: payload.project_type,
                        branding: {
                            logo_url: payload.branding.logo_url,
                            color: payload.branding.color,
                        },
                        backend_requirements: payload.backend_requirements,
                    });
                const collection =
                    await this.collectionService.createCollection({
                        name: `${webProject.name} web integrated with ${backendProject.name} backend service`,
                        description: `Collection for ${webProject.name} web project and ${backendProject.name} backend service project`,
                        web_project_id: webProject.id,
                        backend_service_project_ids: [backendProject.id],
                        organization_id: organization.id,
                    });
                await this.developmentService.triggerTechnicalProjectManagerAiAgentToCreateRequirements(
                    collection.id,
                    webProject.description,
                    backendProject.backend_requirements,
                );

                return { webProject, backendProject, collection };
            } else {
                throw new BadRequestException(
                    `Invalid project type: ${payload.project_type}`,
                );
            }
        } catch (error) {
            this.logger.error({
                message: `${this.serviceName}.createProjectFromOnboarding: Error creating project from onboarding`,
                metadata: { error, timestamp: new Date() },
            });
            throw error;
        }
    }

    async createProjectInfrastructure(projectId: string) {
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
        });

        if (!project) {
            throw new NotFoundException(
                `Project with id ${projectId} not found`,
            );
        }

        await this.githubService.createRepositoryFromTemplate({
            projectTemplateName: ProjectTemplateName.NextJsWeb,
            description: `NextJS (web) project for ${project.name}`,
            projectId: project.id,
        });

        this.logger.log({
            message: `${this.serviceName}.createInfrastructure: Project created`,
            metadata: {
                projectId: project.id,
                timestamp: new Date(),
            },
        });

        const supabaseProject =
            await this.supabaseService.createNewSupabaseProject(project.id);
        this.logger.log({
            message: `${this.serviceName}.createInfrastructure: Supabase project created`,
            metadata: { projectId: project.id, supabaseProject },
        });

        const vercelProject =
            await this.frontendInfraService.createNewVercelProject({
                project_id: project.id,
            });
        this.logger.log({
            message: `${this.serviceName}.createInfrastructure: Vercel project created`,
            metadata: { projectId: project.id, vercelProject },
        });
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
            backend_requirements: payload.backend_requirements,
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

        const supabase = await this.supabaseRepository.findOne({
            where: { project_id: id },
        });

        if (supabase) {
            await this.supabaseService.deleteSupabaseProject(id);
        }

        const koyeb = await this.koyebProjectRepository.findOne({
            where: { project_id: id },
        });

        if (koyeb) {
            await this.backendInfraService.deleteKoyebProject(id);
        }

        const vercel = await this.vercelProjectRepository.findOne({
            where: { project_id: id },
        });

        if (vercel) {
            await this.frontendInfraService.deleteVercelProjectByProjectId(id);
        }

        await this.projectRepository.delete(id);

        // Delete project database
        await this.projectDbManagerService.deleteProjectDatabase(id);

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

    async getOverallProjectDocumentation(id: string): Promise<string> {
        const info = await this.getProjectInfo(id);
        const features = await this.getProjectFeatures(id);
        const pages = await this.getProjectPages(id);
        const branding = await this.getProjectBranding(id);

        const formattedInfo = formatBasicInfo(info as Project);
        const formattedFeatures = formatFeatures(features);
        const formattedPages = formatPages(pages);
        const formattedBranding = formatBranding(branding as Branding);

        const documentation = `
Project Documentation
Overview of the project follow customer requirements that need to be implemented web application
====================

${formattedInfo}

${formattedFeatures}

${formattedPages}

${formattedBranding}
`;

        return documentation;
    }

    async getUpdatedRequirements(id: string) {
        const latestIteration = await this.iterationRepository.findOne({
            where: { project_id: id },
            order: { created_at: "DESC" },
        });
        const latestIterationCreationTime = latestIteration.created_at;

        this.logger.log({
            message: `${this.serviceName}.getUpdatedRequirements: Latest iteration completed time`,
            metadata: {
                latestIterationCompletedTime: latestIterationCreationTime,
                timestamp: new Date(),
            },
        });

        // Get updated branding requirements after latest iteration
        const branding = await this.brandingRepository.find({
            where: {
                projectId: id,
                updated_at: latestIterationCreationTime
                    ? MoreThan(latestIterationCreationTime)
                    : undefined,
            },
        });

        // Get updated page requirements after latest iteration
        const pages = await this.pageRepository.find({
            where: {
                project_id: id,
                updated_at: latestIterationCreationTime
                    ? MoreThan(latestIterationCreationTime)
                    : undefined,
            },
        });

        // Get updated feature requirements after latest iteration
        const features = await this.featureRepository.find({
            where: {
                project_id: id,
                updated_at: latestIterationCreationTime
                    ? MoreThan(latestIterationCreationTime)
                    : undefined,
            },
        });
        this.logger.log({
            message: `${this.serviceName}.getUpdatedRequirements: Updated requirements`,
            metadata: {
                branding,
                pages,
                features,
            },
        });

        return {
            branding,
            pages,
            features,
        };
    }

    formatUpdatedRequirements(requirements: {
        branding: any[];
        pages: any[];
        features: any[];
    }): string {
        let formattedUpdatedRequirements =
            "Updated Project Requirements:\n=========================\n\n";

        // Format branding requirements
        if (requirements.branding && requirements.branding.length > 0) {
            const branding = requirements.branding[0];
            formattedUpdatedRequirements +=
                "Branding Updated Requirements:\n-------------------\n";
            formattedUpdatedRequirements += `Logo URL: ${branding.logo_url || "Not specified"}\n`;
            formattedUpdatedRequirements += `Theme Color: ${branding.color || "Not specified"}\n`;
            formattedUpdatedRequirements += `Theme Mode: ${branding.theme || "Not specified"}\n`;
            formattedUpdatedRequirements += `Brand Perception: ${branding.perception || "Not specified"}\n\n`;
        }

        // Format pages requirements
        if (requirements.pages && requirements.pages.length > 0) {
            formattedUpdatedRequirements +=
                "Page Updated Requirements:\n----------------\n";
            for (const page of requirements.pages) {
                formattedUpdatedRequirements += `Page: ${page.name || "Unnamed"}\n`;
                formattedUpdatedRequirements += `Description: ${page.description || "No description"}\n\n`;
            }
        }

        // Format feature requirements
        if (requirements.features && requirements.features.length > 0) {
            formattedUpdatedRequirements +=
                "Feature Updated Requirements:\n-------------------\n";
            for (const feature of requirements.features) {
                formattedUpdatedRequirements += `Feature: ${feature.name || "Unnamed"}\n`;
                formattedUpdatedRequirements += `Description: ${feature.description || "No description"}\n\n`;
            }
        }

        return formattedUpdatedRequirements;
    }

    async requestGithubAccess(projectId: string, uId: string) {
        this.logger.log({
            message: `${this.serviceName}.requestGithubAccess: Requesting GitHub access`,
            metadata: { projectId },
        });

        // Get the project to verify it exists
        const project = await this.getProjectById(projectId);
        if (!project) {
            throw new NotFoundException(
                `Project with id ${projectId} not found`,
            );
        }

        // Get GitHub username from Supabase
        const githubUsername =
            await this.supabaseService.getGithubUsername(uId);
        if (!githubUsername) {
            throw new BadRequestException(
                "GitHub username not found in Supabase",
            );
        }

        // Get all repositories for this project
        const repositories = await this.githubRepoRepository.find({
            where: { project_id: projectId },
        });

        if (!repositories || repositories.length === 0) {
            throw new NotFoundException(
                `No GitHub repositories found for project ${projectId}`,
            );
        }

        // Execute GitHub CLI command to add collaborator for each repository
        const results = [];

        for (const repo of repositories) {
            // const command = `gh api --method PUT -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" /repos/genesoftai/${repo.name}/collaborators/${githubUsername} -f permission=triage`;
            try {
                const response = await this.githubService.addUserToCollaborator(
                    repo.name,
                    githubUsername,
                );
                this.logger.log({
                    message: `${this.serviceName}.requestGithubAccess: Response`,
                    metadata: { response: response.status },
                });
                results.push({
                    repository: repo.name,
                    success: true,
                    data: response.data,
                });
            } catch (error) {
                this.logger.error({
                    message: `${this.serviceName}.requestGithubAccess: Error adding user to collaborator`,
                    metadata: { error },
                });
                results.push({
                    repository: repo.name,
                    success: false,
                    error: error.message,
                });
            }
        }

        return {
            success: true,
            message: "GitHub access request processed for all repositories",
            results,
        };
    }
}
