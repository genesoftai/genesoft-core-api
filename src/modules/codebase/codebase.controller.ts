import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
} from "@nestjs/common";
import { CodebaseService } from "./codebase.service";
import { UpdateFileDto } from "./dto/update-file.dto";

@Controller("codebase")
export class CodebaseController {
    constructor(private readonly codebaseService: CodebaseService) {}

    @Post()
    async createCodebase(@Body() body: { projectId: string }) {
        return this.codebaseService.createCodebase(body.projectId);
    }

    @Get(":projectId")
    async getCodebase(@Param("projectId") projectId: string) {
        return this.codebaseService.getCodebase(projectId);
    }

    @Put(":projectId")
    async updateCodebase(
        @Param("projectId") projectId: string,
        @Body() body: { understanding: string },
    ) {
        return this.codebaseService.updateCodebase(
            projectId,
            body.understanding,
        );
    }

    @Delete(":projectId")
    async deleteCodebase(@Param("projectId") projectId: string) {
        return this.codebaseService.deleteCodebase(projectId);
    }

    @Post(":projectId/nextjs")
    async initializeNextjsCodebase(@Param("projectId") projectId: string) {
        return this.codebaseService.createCodebaseForNextjsProject(projectId);
    }

    @Post(":projectId/nestjs")
    async initializeNestjsCodebase(@Param("projectId") projectId: string) {
        return this.codebaseService.createCodebaseForNestjsProject(projectId);
    }

    @Get(":projectId/trees")
    async getRepositoryTreesFromProject(@Param("projectId") projectId: string) {
        return this.codebaseService.getRepositoryTreesFromProject(projectId);
    }

    @Get(":projectId/files")
    async getFileContentFromProject(
        @Param("projectId") projectId: string,
        @Query("path") path: string,
    ) {
        return this.codebaseService.getFileContentFromProject(projectId, path);
    }

    @Put(":projectId/files")
    async updateRepositoryFile(
        @Param("projectId") projectId: string,
        @Body() payload: UpdateFileDto,
    ) {
        return this.codebaseService.updateRepositoryFile({
            projectId,
            path: payload.path,
            content: payload.content,
            message: payload.message,
        });
    }

    @Put(":projectId/instruction")
    async updateCodebaseInstruction(
        @Param("projectId") projectId: string,
        @Body() body: { instruction: string },
    ) {
        return this.codebaseService.updateCodebaseInstruction(
            projectId,
            body.instruction,
        );
    }
}
