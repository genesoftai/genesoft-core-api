import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { FirebaseService } from "./firebase.service";

@Controller("firebase")
export class FirebaseController {
    constructor(private readonly firebaseService: FirebaseService) {}

    @Post("projects")
    async createProject(@Body() body: { project_id: string }) {
        return this.firebaseService.createGoogleCloudProject(body.project_id);
    }

    @Get("gcp/projects")
    async getGcpProjects() {
        return this.firebaseService.getGcpProjects();
    }
}
