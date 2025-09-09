import { Controller, Post, Body, Get, Param } from "@nestjs/common";
import { GithubManagementService } from "./github-management.service";
import { CreateBranchDto } from "./dto/create-branch.dto";
import { StartGithubTaskDto } from "./dto/github-task.dto";
import { CreatePRDto } from "./dto/github-pr.dto";

@Controller("github-management")
export class GithubManagementController {
    constructor(
        private readonly githubManagementService: GithubManagementService,
    ) {}

    @Get("organization/:organizationId/repositories")
    async getGithubRepositories(
        @Param("organizationId") organizationId: string,
    ) {
        return this.githubManagementService.getAllGithubRepositoriesByOrganizationId(
            organizationId,
        );
    }

    @Post("organization/:organizationId/task")
    async startTask(@Body() startGithubTaskDto: StartGithubTaskDto) {
        return this.githubManagementService.startTask(startGithubTaskDto);
    }

    @Post("organization/:organizationId/pull-request")
    async createPR(@Body() payload: CreatePRDto) {
        return this.githubManagementService.createPR(payload);
    }

    @Post("organization/:organizationId/branch")
    async createBranch(@Body() createBranchDto: CreateBranchDto) {
        return this.githubManagementService.createBranch(createBranchDto);
    }

    @Get("organization/:organizationId/branch/:branchId")
    async getBranch(@Param("branchId") branchId: string) {
        return this.githubManagementService.getBranch(branchId);
    }

    @Get("organization/:organizationId/branch/:branchId/iterations")
    async getIterationsByBranchId(@Param("branchId") branchId: string) {
        return this.githubManagementService.getIterationsByBranchId(branchId);
    }

    @Get("organization/:organizationId/repository/:repositoryId")
    async getGithubRepository(@Param("repositoryId") repositoryId: string) {
        return this.githubManagementService.getGithubRepositoryId(repositoryId);
    }

    @Get(
        "organization/:organizationId/repository/:repositoryId/branches/github",
    )
    async getAllBranchesOnGithub(@Param("repositoryId") repositoryId: string) {
        return this.githubManagementService.getAllBranchesOnGithub(
            repositoryId,
        );
    }

    @Get("organization/:organizationId/project/:projectId")
    async getGithubRepositoryProjectId(@Param("projectId") projectId: string) {
        return this.githubManagementService.getGithubRepositoryProjectId(
            projectId,
        );
    }

    @Get("organization/:organizationId/collection/:collectionId")
    async getGithubRepositoryCollectionId(
        @Param("collectionId") collectionId: string,
    ) {
        return this.githubManagementService.getGithubRepositoriesByCollectionId(
            collectionId,
        );
    }

    @Get("organization/:organizationId/repository/:repositoryId/branch")
    async getBranches(@Param("repositoryId") repositoryId: string) {
        return this.githubManagementService.getBranches(repositoryId);
    }

    @Get("organization/:organizationId/repository/:repositoryId/tasks")
    async getTasksByRepositoryId(@Param("repositoryId") repositoryId: string) {
        return this.githubManagementService.getTasksByRepositoryId(
            repositoryId,
        );
    }
}
