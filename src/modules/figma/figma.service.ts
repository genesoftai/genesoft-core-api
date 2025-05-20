import { HttpService } from "@nestjs/axios";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { catchError, lastValueFrom, map } from "rxjs";
import { ThirdPartyConfigurationService } from "../configuration/third-party";
import {
    extractFigmaCanvasAndFrame,
    extractFigmaChildren,
    figmaStructureToString,
} from "@/utils/figma/file";
import { FigmaFile } from "./entity/figma-file.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
    SaveFigmaFileDto,
    UpdateFigmaFileForProjectDto,
} from "./dto/save-figma-file.dto";
import { Project } from "../project/entity/project.entity";

@Injectable()
export class FigmaService {
    private readonly figmaApiUrl = "https://api.figma.com";
    private readonly logger = new Logger(FigmaService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly thirdPartyConfigurationService: ThirdPartyConfigurationService,
        @InjectRepository(FigmaFile)
        private readonly figmaFileRepository: Repository<FigmaFile>,
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,
    ) {}

    async getFigmaFile(fileKey: string) {
        const accessToken =
            this.thirdPartyConfigurationService.figmaAccessToken;
        this.logger.log(
            `Getting file ${fileKey} with access token ${accessToken}`,
        );
        const response = await lastValueFrom(
            this.httpService
                .get(`${this.figmaApiUrl}/v1/files/${fileKey}`, {
                    headers: {
                        "X-Figma-Token": accessToken,
                    },
                })
                .pipe(
                    map((res) => res.data),
                    catchError((error) => {
                        throw new Error(error);
                    }),
                ),
        );

        return response;
    }

    async getFigmaNodeById(fileKey: string, nodeId: string) {
        const accessToken =
            this.thirdPartyConfigurationService.figmaAccessToken;
        this.logger.log(
            `Getting file ${fileKey} with access token ${accessToken}`,
        );
        const response = await lastValueFrom(
            this.httpService
                .get(
                    `${this.figmaApiUrl}/v1/files/${fileKey}/nodes?ids=${nodeId}`,
                    {
                        headers: {
                            "X-Figma-Token": accessToken,
                        },
                    },
                )
                .pipe(
                    map((res) => res.data),
                    catchError((error) => {
                        throw new Error(error);
                    }),
                ),
        );

        return response.nodes[nodeId];
    }

    async getFigmaFileChildren(fileKey: string) {
        try {
            const file = await this.getFigmaFile(fileKey);
            this.logger.log({
                message: "Figma file",
                children: file.document.children,
            });
            return extractFigmaChildren(file.document.children);
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }

    async getFigmaCanvasAndFrame(fileKey: string) {
        const file = await this.getFigmaFile(fileKey);
        return extractFigmaCanvasAndFrame(file.document.children);
    }

    async saveFigmaFile(payload: SaveFigmaFileDto) {
        const { fileKey, projectId } = payload;
        return this.figmaFileRepository.save({
            figma_file_key: fileKey,
            project_id: projectId,
        });
    }

    async updateFigmaFileForProject(payload: UpdateFigmaFileForProjectDto) {
        const { fileKey, projectId, fileUrl } = payload;
        const project = await this.projectRepository.findOne({
            where: { id: projectId },
        });

        if (!project) {
            throw new NotFoundException("Project not found");
        }

        const figmaFile = await this.figmaFileRepository.findOne({
            where: {
                project_id: projectId,
            },
        });
        if (!figmaFile) {
            const newFigmaFile = await this.figmaFileRepository.save({
                figma_file_key: fileKey,
                project_id: projectId,
                figma_file_url: fileUrl,
            });
            const updatedProject = await this.projectRepository.update(
                projectId,
                {
                    figma_file_id: newFigmaFile.id,
                },
            );
            return { project: updatedProject, figmaFile: newFigmaFile };
        }

        const updatedFigmaFile = await this.figmaFileRepository.update(
            figmaFile.id,
            {
                figma_file_key: fileKey,
                figma_file_url: fileUrl,
            },
        );
        return { project, figmaFile: updatedFigmaFile };
    }

    async getFigmaFileByProjectId(projectId: string) {
        return this.figmaFileRepository.findOne({
            where: {
                project_id: projectId,
            },
        });
    }

    async figmaStructureToStringFormatted(fileKey: string) {
        const nodes = await this.getFigmaFileChildren(fileKey);
        const formatted_structure = figmaStructureToString(nodes);
        this.logger.log({
            message: "Figma structure",
            formatted_structure,
        });
        return { formatted_structure };
    }

    async getFigmaFileByFileKey(fileKey: string, image_ids: string) {
        const accessToken =
            this.thirdPartyConfigurationService.figmaAccessToken;
        this.logger.log({
            message: "Getting figma images by file key",
            fileKey,
            image_ids,
        });
        const response = await lastValueFrom(
            this.httpService
                .get(
                    `${this.figmaApiUrl}/v1/images/${fileKey}?ids=${image_ids}`,
                    {
                        headers: {
                            "X-Figma-Token": accessToken,
                        },
                    },
                )
                .pipe(
                    map((res) => res.data),
                    catchError((error) => {
                        throw new Error(error);
                    }),
                ),
        );
        return response;
    }
}
// XOPjr1ddz9IwklsEdJrF7D -> AI Generated Design
// XOPjr1ddz9IwklsEdJrF7D -> good design
