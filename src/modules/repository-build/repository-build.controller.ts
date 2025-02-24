import { Body, Controller, Post } from "@nestjs/common";
import { RepositoryBuildService } from "./repository-build.service";
import {
    CheckFrontendRepositoryBuildDto,
    CheckRepositoryBuildOverviewDto,
} from "./dto/repository-build.dto";

@Controller("repository-build")
export class RepositoryBuildController {
    constructor(
        private readonly repositoryBuildService: RepositoryBuildService,
    ) {}

    @Post("check")
    async triggerBackendBuild(
        @Body() payload: CheckRepositoryBuildOverviewDto,
    ) {
        return this.repositoryBuildService.checkRepositoryBuildOverview(
            payload,
        );
    }

    @Post("check/frontend")
    async checkFrontendBuild(@Body() payload: CheckFrontendRepositoryBuildDto) {
        return this.repositoryBuildService.checkFrontendBuild(payload);
    }
}
