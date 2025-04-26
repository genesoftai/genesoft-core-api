import { CollectionService } from "./collection.service";
import {
    Body,
    Controller,
    Post,
    Get,
    Put,
    Delete,
    Param,
    UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { CreateCollectionDto } from "./dto/create-collection.dto";
import { Collection } from "./entity/collection.entity";
import { Project } from "../project/entity/project.entity";
import { GithubRepository } from "../github/entity/github-repository.entity";

@Controller("collection")
export class CollectionController {
    constructor(private readonly collectionService: CollectionService) {}

    @Post("")
    @UseGuards(AuthGuard)
    createCollection(@Body() body: CreateCollectionDto): Promise<Collection> {
        return this.collectionService.createCollection(body);
    }

    @Get("web-project/:webProjectId")
    @UseGuards(AuthGuard)
    getCollectionByWebProjectId(
        @Param("webProjectId") webProjectId: string,
    ): Promise<Collection> {
        return this.collectionService.getCollectionByWebProjectId(webProjectId);
    }

    @Get("available-web-projects/:organizationId")
    @UseGuards(AuthGuard)
    getAvailableWebProjectsForOrganization(
        @Param("organizationId") organizationId: string,
    ): Promise<Project[]> {
        return this.collectionService.getAvailableWebProjectsForOrganization(
            organizationId,
        );
    }

    @Get("backend-project/web-project/:webProjectId")
    @UseGuards(AuthGuard)
    getBackendProjectForWebProject(
        @Param("webProjectId") webProjectId: string,
    ): Promise<{ backendProject: Project; repository: GithubRepository }> {
        return this.collectionService.getBackendProjectForWebProject(
            webProjectId,
        );
    }

    @Get(":id")
    @UseGuards(AuthGuard)
    getCollection(@Param("id") id: string) {
        return this.collectionService.getCollection(id);
    }

    @Put(":id")
    @UseGuards(AuthGuard)
    updateCollection(
        @Param("id") id: string,
        @Body() body: Partial<Collection>,
    ): Promise<Collection> {
        return this.collectionService.updateCollection(id, body);
    }

    @Delete(":id")
    @UseGuards(AuthGuard)
    deleteCollection(@Param("id") id: string): Promise<void> {
        return this.collectionService.deleteCollection(id);
    }

    @Put(":id/web-project")
    @UseGuards(AuthGuard)
    changeWebProjectInCollection(
        @Param("id") id: string,
        @Body() body: { webProjectId: string },
    ): Promise<Collection> {
        return this.collectionService.changeWebProjectInCollection(
            id,
            body.webProjectId,
        );
    }

    @Delete(":id/web-project")
    @UseGuards(AuthGuard)
    removeWebProjectFromCollection(
        @Param("id") id: string,
    ): Promise<Collection> {
        return this.collectionService.removeWebProjectFromCollection(id);
    }

    @Put(":id/backend-project")
    @UseGuards(AuthGuard)
    addBackendIntoCollection(
        @Param("id") id: string,
        @Body() body: { backendProjectId: string },
    ): Promise<Collection> {
        return this.collectionService.addBackendIntoCollection(
            id,
            body.backendProjectId,
        );
    }

    @Delete(":id/backend-project")
    @UseGuards(AuthGuard)
    removeBackendFromCollection(
        @Param("id") id: string,
        @Body() body: { backendProjectId: string },
    ): Promise<Collection> {
        return this.collectionService.removeBackendFromCollection(
            id,
            body.backendProjectId,
        );
    }
}
