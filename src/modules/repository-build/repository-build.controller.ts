import { Body, Controller, Post, Put } from "@nestjs/common";
import { RepositoryBuildService } from "./repository-build.service";
import {
    CheckFrontendRepositoryBuildDto,
    CheckRepositoryBuildOverviewDto,
    RecheckFrontendBuildDto,
    UpdateRepositoryBuildStatusDto,
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

    @Post("recheck")
    async recheckFrontendBuild(@Body() payload: RecheckFrontendBuildDto) {
        return this.repositoryBuildService.recheckFrontendBuildWithoutRebuild(
            payload,
        );
    }

    @Put("status")
    async updateRepositoryBuildStatus(
        @Body() payload: UpdateRepositoryBuildStatusDto,
    ) {
        return this.repositoryBuildService.updateRepositoryBuildStatus(payload);
    }
}
