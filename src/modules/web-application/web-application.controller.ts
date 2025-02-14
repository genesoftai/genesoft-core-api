import { Controller, Get, Param } from "@nestjs/common";
import { WebApplicationService } from "./web-application.service";

@Controller("web-application")
export class WebApplicationController {
    constructor(
        private readonly webApplicationService: WebApplicationService,
    ) {}

    @Get("/project/:projectId")
    async getWebApplication(@Param("projectId") projectId: string) {
        return this.webApplicationService.getWebApplication(projectId);
    }
}
