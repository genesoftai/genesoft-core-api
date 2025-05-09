import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { FigmaService } from "./figma.service";
import { SaveFigmaFileDto } from "./dto/save-figma-file.dto";

@Controller("figma")
export class FigmaController {
    constructor(private readonly figmaService: FigmaService) {}

    @Post("file")
    async saveFigmaFile(@Body() payload: SaveFigmaFileDto) {
        return this.figmaService.saveFigmaFile(payload);
    }

    @Get("file/project/:projectId")
    async getFigmaFileByProjectId(@Param("projectId") projectId: string) {
        return this.figmaService.getFigmaFileByProjectId(projectId);
    }

    @Get("file/:fileKey")
    async getFigmaFile(@Param("fileKey") fileKey: string) {
        return this.figmaService.getFigmaFile(fileKey);
    }

    @Get("file/:fileKey/node/:nodeId")
    async getFigmaNodeById(
        @Param("fileKey") fileKey: string,
        @Param("nodeId") nodeId: string,
    ) {
        return this.figmaService.getFigmaNodeById(fileKey, nodeId);
    }

    @Get("file/:fileKey/children")
    async getFigmaFileChildren(@Param("fileKey") fileKey: string) {
        return this.figmaService.getFigmaFileChildren(fileKey);
    }

    @Get("file/:fileKey/structure")
    async getFigmaStructure(@Param("fileKey") fileKey: string) {
        return this.figmaService.figmaStructureToStringFormatted(fileKey);
    }

    @Get("file/:fileKey/canvas-and-frame")
    async getFigmaCanvasAndFrame(@Param("fileKey") fileKey: string) {
        return this.figmaService.getFigmaCanvasAndFrame(fileKey);
    }

    @Get("file/:fileKey/images")
    async getFigmaFileByFileKey(
        @Param("fileKey") fileKey: string,
        @Query("image_ids") imageIds: string,
    ) {
        return this.figmaService.getFigmaFileByFileKey(fileKey, imageIds);
    }
}
