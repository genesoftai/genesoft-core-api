import {
    Body,
    Controller,
    Get,
    Post,
    Put,
    Query,
    UseGuards,
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

    @Get("content")
    @UseGuards(AuthGuard)
    getRepositoryContent(@Query() query: GetRepositoryContentDto) {
        return this.githubService.getRepositoryContent(query);
    }

    @Put("content")
    @UseGuards(AuthGuard)
    updateRepositoryContent(@Body() body: UpdateRepositoryContentDto) {
        return this.githubService.updateRepositoryContent(body);
    }

    @Post("branch/merge")
    @UseGuards(AuthGuard)
    mergeBrach(@Body() payload: MergeGithubBrachDto) {
        return this.githubService.mergeBranch(payload);
    }

    @Get("repository/all-env")
    @UseGuards(AuthGuard)
    getAllEnvVars(@Query() payload: GetAllRepositoryEnvQuery) {
        return this.githubService.getAllEnvVars(payload);
    }
}
