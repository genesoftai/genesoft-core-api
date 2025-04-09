import {
    Body,
    Controller,
    Get,
    Headers,
    Param,
    Post,
    Put,
    Query,
    UseGuards,
    Delete,
    RawBodyRequest,
    Req,
    Logger,
    OnModuleInit,
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
import { Request } from "express";
import { AppConfigurationService } from "../configuration/app";
import * as crypto from "crypto";

@ApiTags("Github")
@Controller("github")
export class GithubController {
    private controllerName = GithubController.name;

    constructor(
        private readonly githubService: GithubService,
        private readonly appConfigurationService: AppConfigurationService,
    ) {}

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

    @Post("webhook")
    async handleWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers("x-github-event") eventType: string,
        @Headers("x-hub-signature-256") signature: string,
        @Body() payload: any,
    ) {
        // const rawBody = req.rawBody;
        const webhookSecret = this.appConfigurationService.githubWebhookSecret;

        if (!webhookSecret) {
            return {
                status: "error",
                message: "Webhook secret not configured",
            };
        }

        const stringifiedPayload = JSON.stringify(payload);
        // Verify webhook signature
        const hmac = crypto.createHmac("sha256", webhookSecret);
        const calculatedSignature = `sha256=${hmac
            .update(stringifiedPayload)
            .digest("hex")}`;

        if (signature !== calculatedSignature) {
            return {
                status: "error",
                message: "Invalid signature",
            };
        }

        // Handle different event types
        if (eventType === "pull_request") {
            const action = payload.action;
            const pullRequest = payload.pull_request;
            const repository = payload.repository;

            Logger.log(
                `Pull request ${action} for ${repository.full_name} #${pullRequest.number}: ${pullRequest.title}`,
            );

            // Check if PR is not from khemmapichpanyana and is targeting the dev branch
            if (
                pullRequest.user.login !== "khemmapichpanyana" &&
                pullRequest.base.ref === "dev" &&
                action === "opened"
            ) {
                // Wait 10 seconds for mergeable state to be calculated by GitHub
                setTimeout(async () => {
                    try {
                        // Get updated PR details with accurate mergeable state
                        const updatedPR =
                            await this.githubService.getPullRequest({
                                repository: repository.name,
                                pull_number: pullRequest.number,
                            });

                        if (updatedPR && updatedPR.mergeable) {
                            // Automatically merge the PR if mergeable
                            await this.githubService.mergePullRequest({
                                repository: repository.name,
                                pull_number: pullRequest.number,
                                merge_method: "merge",
                            });

                            Logger.log(
                                `Automatically merged PR #${pullRequest.number} from ${pullRequest.user.login} into dev branch`,
                            );
                        } else {
                            Logger.log(
                                `PR #${pullRequest.number} is not mergeable due to conflicts, waiting for updates`,
                            );
                        }
                    } catch (error) {
                        Logger.error(
                            `Failed to auto-merge PR #${pullRequest.number}:`,
                            error,
                        );
                    }
                }, 10000); // 10 seconds delay
            }

            // Also handle PR updates (when conflicts are resolved)
            if (
                pullRequest.user.login !== "khemmapichpanyana" &&
                pullRequest.base.ref === "dev" &&
                action === "synchronize" &&
                !pullRequest.merged
            ) {
                try {
                    // Check if PR is mergeable after update
                    if (pullRequest.mergeable) {
                        // Automatically merge the PR after conflicts were resolved
                        await this.githubService.mergePullRequest({
                            repository: repository.name,
                            pull_number: pullRequest.number,
                            merge_method: "merge",
                        });

                        Logger.log(
                            `Automatically merged updated PR #${pullRequest.number} from ${pullRequest.user.login} into dev branch after conflicts were resolved`,
                        );
                    } else {
                        Logger.log(
                            `Updated PR #${pullRequest.number} is not mergeable yet, waiting for conflicts to be fully resolved`,
                        );
                    }
                } catch (error) {
                    Logger.error(
                        `Failed to auto-merge updated PR #${pullRequest.number}:`,
                        error,
                    );
                }
            }
        }

        return {
            status: "success",
        };
    }
}
