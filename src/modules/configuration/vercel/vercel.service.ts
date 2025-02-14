import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class VercelConfigurationService {
    constructor(private configService: ConfigService) {}

    get vercelTeamId() {
        return this.configService.get("vercel.vercelTeamId");
    }

    get vercelAccessToken() {
        return this.configService.get("vercel.vercelAccessToken");
    }
}
