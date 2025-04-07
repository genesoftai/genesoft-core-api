import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
} from "@nestjs/common";
import { ProjectService } from "./project.service";
import {
    CreateProjectFromOnboardingDto,
    CreateProjectDto,
} from "./dto/create-project.dto";
import {
    UpdateProjectDto,
    BrandingDto,
    PageDto,
    FeatureDto,
} from "./dto/update-project.dto";
import { AuthGuard } from "../auth/auth.guard";

@Controller("project")
@UseGuards(AuthGuard)
export class ProjectController {
    constructor(private readonly projectService: ProjectService) {}

    @Post()
    async createProject(@Body() payload: CreateProjectDto) {
        return this.projectService.createProject(payload);
    }

    @Post("onboarding")
    async createProjectFromOnboarding(
        @Body() payload: CreateProjectFromOnboardingDto,
    ) {
        return this.projectService.createProjectFromOnboarding(payload);
    }

    @Get(":id")
    async getProjectById(@Param("id") id: string) {
        return this.projectService.getProjectById(id);
    }

    @Delete(":id")
    async deleteProject(@Param("id") id: string) {
        return this.projectService.deleteProject(id);
    }

    @Get(":id/info")
    async getProjectInfo(@Param("id") id: string) {
        return this.projectService.getProjectInfo(id);
    }

    @Get(":id/pages")
    async getProjectPages(@Param("id") id: string) {
        return this.projectService.getProjectPages(id);
    }

    @Get(":id/features")
    async getProjectFeatures(@Param("id") id: string) {
        return this.projectService.getProjectFeatures(id);
    }

    @Get(":id/branding")
    async getProjectBranding(@Param("id") id: string) {
        return this.projectService.getProjectBranding(id);
    }

    @Get(":id/infrastructure")
    async getProjectInfrastructure(@Param("id") id: string) {
        return this.projectService.getProjectInfrastructure(id);
    }

    @Post(":id/infrastructure")
    async createProjectInfrastructure(@Param("id") id: string) {
        return this.projectService.createProjectInfrastructure(id);
    }

    @Patch(":id/info")
    async updateProjectInfo(
        @Param("id") id: string,
        @Body() payload: UpdateProjectDto,
    ) {
        return this.projectService.updateProjectInfo(id, payload);
    }

    @Patch(":id/branding")
    async updateBranding(
        @Param("id") id: string,
        @Body() payload: BrandingDto,
    ) {
        return this.projectService.updateBranding(id, payload);
    }

    @Post(":id/page")
    async addPage(@Param("id") id: string, @Body() payload: PageDto) {
        return this.projectService.addPage(id, payload);
    }

    @Post(":id/feature")
    async addFeature(@Param("id") id: string, @Body() payload: FeatureDto) {
        return this.projectService.addFeature(id, payload);
    }

    @Patch(":id/page/:pageId")
    async updatePage(
        @Param("pageId") pageId: string,
        @Body() payload: PageDto,
    ) {
        return this.projectService.updatePage(pageId, payload);
    }

    @Patch(":id/feature/:featureId")
    async updateFeature(
        @Param("featureId") featureId: string,
        @Body() payload: FeatureDto,
    ) {
        return this.projectService.updateFeature(featureId, payload);
    }

    @Delete(":id/page/:pageId")
    async deletePage(@Param("pageId") pageId: string) {
        return this.projectService.deletePage(pageId);
    }

    @Delete(":id/feature/:featureId")
    async deleteFeature(@Param("featureId") featureId: string) {
        return this.projectService.deleteFeature(featureId);
    }

    @Get(":id/page/:pageId/files")
    async getPageFiles(@Param("pageId") pageId: string) {
        return this.projectService.getPageFiles(pageId);
    }

    @Get(":id/page/:pageId/reference-links")
    async getPageReferenceLinks(@Param("pageId") pageId: string) {
        return this.projectService.getPageReferenceLinks(pageId);
    }

    @Get(":id/feature/:featureId/files")
    async getFeatureFiles(@Param("featureId") featureId: string) {
        return this.projectService.getFeatureFiles(featureId);
    }

    @Get(":id/feature/:featureId/reference-links")
    async getFeatureReferenceLinks(@Param("featureId") featureId: string) {
        return this.projectService.getFeatureReferenceLinks(featureId);
    }

    @Get(":id/updated-requirements")
    async getUpdatedRequirements(@Param("id") id: string) {
        return this.projectService.getUpdatedRequirements(id);
    }

    @Post(":id/github-access")
    async requestGithubAccess(
        @Param("id") id: string,
        @Body() payload: { uid: string },
    ) {
        try {
            return this.projectService.requestGithubAccess(id, payload.uid);
        } catch (error) {
            throw new Error(`Failed to decode token: ${error.message}`);
        }
    }
}
