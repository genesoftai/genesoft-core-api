import { Body, Controller, Post } from "@nestjs/common";
import { RepositoryBuildService } from "./repository-build.service";
import {
    CheckBackendRepositoryBuildDto,
    CheckFrontendRepositoryBuildDto,
} from "./dto/repository-build.dto";

@Controller("repository-build")
export class RepositoryBuildController {
    constructor(
        private readonly repositoryBuildService: RepositoryBuildService,
    ) {}

    @Post("check/backend")
    async checkBackendBuild(@Body() payload: CheckBackendRepositoryBuildDto) {
        return this.repositoryBuildService.checkBackendBuild(payload);
    }

    @Post("check/frontend")
    async checkFrontendBuild(@Body() payload: CheckFrontendRepositoryBuildDto) {
        return this.repositoryBuildService.checkFrontendBuild(payload);
    }
}
