import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class GithubConfigurationService {
    constructor(private configService: ConfigService) {}

    get githubAccessToken() {
        return this.configService.get("github.githubAccessToken");
    }

    get githubBaseApiEndpoint() {
        return this.configService.get("github.githubBaseApiEndpoint");
    }

    get githubOwner() {
        return this.configService.get("github.githubOwner");
    }
}
