import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Put,
    Query,
    UseGuards,
    Delete,
} from "@nestjs/common";
import { GithubService } from "./github.service";
import { ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import {
    GetAllRepositoryEnvQuery,
    GetGithubRepositoryFromGithubDto,
    GetRepositoryTreesQuery,
} from "./dto/get-github-repository.dto";
import { CreateGithubRepositoryUsingTemplateDto } from "./dto/create-github-repository.dto";
import { GetRepositoryContentDto } from "./dto/get-repository-content.dto";
import {
    MergeGithubBrachDto,
    UpdateRepositoryContentDto,
} from "./dto/update-repository-content.dto";
import {
    CreatePullRequestDto,
    MergePullRequestDto,
} from "./dto/pull-requests.dto";
import { DeleteFileContentFromRepositoryDto } from "./dto/delete-repository-content.dto";

@ApiTags("Github")
@Controller("github")
export class GithubController {
    private controllerName = GithubController.name;
    constructor(private readonly githubService: GithubService) {}

    @Get("repository")
    @UseGuards(AuthGuard)
    getRepositoryFromGithub(@Query() query: GetGithubRepositoryFromGithubDto) {
        return this.githubService.getGithubRepositoryFromGithub(query);
    }

    @Get("repository/trees")
    @UseGuards(AuthGuard)
    getRepositoryTrees(@Query() query: GetRepositoryTreesQuery) {
        return this.githubService.getRepositoryTrees(query);
    }

    @Post("repository/template")
    @UseGuards(AuthGuard)
    createGithubRepositoryUsingTemplate(
        @Body()
        createGithubRepositoryUsingTemplateDto: CreateGithubRepositoryUsingTemplateDto,
    ) {
        return this.githubService.createRepositoryFromTemplate(
            createGithubRepositoryUsingTemplateDto,
        );
    }

    @Get("repository/content")
    @UseGuards(AuthGuard)
    getRepositoryContent(@Query() query: GetRepositoryContentDto) {
        return this.githubService.getRepositoryContent(query);
    }

    @Put("repository/content")
    @UseGuards(AuthGuard)
    updateRepositoryContent(@Body() body: UpdateRepositoryContentDto) {
        return this.githubService.updateRepositoryContent(body);
    }

    @Delete("repository/content")
    @UseGuards(AuthGuard)
    deleteFileContentFromRepository(
        @Body() payload: DeleteFileContentFromRepositoryDto,
    ) {
        return this.githubService.deleteFileContentFromRepository(payload);
    }

    @Post("repository/branch/merge")
    @UseGuards(AuthGuard)
    mergeBrach(@Body() payload: MergeGithubBrachDto) {
        return this.githubService.mergeBranch(payload);
    }

    @Get("repository/all-env")
    @UseGuards(AuthGuard)
    getAllEnvVars(@Query() payload: GetAllRepositoryEnvQuery) {
        return this.githubService.getAllEnvVars(payload);
    }

    @Post("repository/pull-request")
    @UseGuards(AuthGuard)
    createPullRequest(@Body() payload: CreatePullRequestDto) {
        return this.githubService.createPullRequest(payload);
    }

    @Put("repository/pull-request/merge")
    @UseGuards(AuthGuard)
    mergePullRequest(@Body() payload: MergePullRequestDto) {
        return this.githubService.mergePullRequest(payload);
    }

    @Get("repository/workflows/:repository/runs/:branch")
    @UseGuards(AuthGuard)
    getWorkflowRuns(
        @Param("repository") repository: string,
        @Param("branch") branch: string,
    ) {
        return this.githubService.getWorkflowRuns({ repository, branch });
    }

    @Get("repository/workflows/:repository/runs/:run_id/logs")
    @UseGuards(AuthGuard)
    getWorkflowRunLogs(
        @Param("repository") repository: string,
        @Param("run_id") run_id: string,
    ) {
        return this.githubService.getWorkflowRunLogs({ repository, run_id });
    }

    @Get(
        "repository/workflows/:repository/runs/:run_id/logs/failure/:failed_step",
    )
    @UseGuards(AuthGuard)
    getWorkflowRunFailureLogs(
        @Param("repository") repository: string,
        @Param("run_id") run_id: string,
        @Param("failed_step") failed_step: number,
    ) {
        return this.githubService.getWorkflowRunFailureLogs({
            repository,
            run_id,
            failed_step,
        });
    }

    @Get("repository/workflow/project/:project_id/run/latest/:branch")
    @UseGuards(AuthGuard)
    getLatestWorkflowRun(
        @Param("project_id") project_id: string,
        @Param("branch") branch: string,
    ) {
        return this.githubService.getLatestWorkflowRun({
            project_id,
            branch,
        });
    }
}
