import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AppConfigurationService {
    constructor(private configService: ConfigService) {}

    get port() {
        return this.configService.get("app.port");
    }

    get genesoftApiKey() {
        return this.configService.get("app.genesoftApiKey");
    }

    get databaseUrl() {
        return this.configService.get("app.databaseUrl");
    }

    get databaseHost() {
        return this.configService.get("app.databaseHost");
    }

    get databasePort() {
        return this.configService.get("app.databasePort");
    }

    get databaseUser() {
        return this.configService.get("app.databaseUser");
    }

    get databasePassword() {
        return this.configService.get("app.databasePassword");
    }

    get databaseName() {
        return this.configService.get("app.databaseName");
    }

    get genesoftWebBaseUrl() {
        return this.configService.get("app.genesoftWebBaseUrl");
    }

    get nodeEnv() {
        return this.configService.get("app.nodeEnv");
    }

    get freeTierIterationsLimit() {
        return this.configService.get("app.freeTierIterationsLimit");
    }

    get startupTierIterationsLimit() {
        return this.configService.get("app.startupTierIterationsLimit");
    }

    get githubWebhookUrl() {
        return this.configService.get("app.githubWebhookUrl");
    }

    get githubWebhookSecret() {
        return this.configService.get("app.githubWebhookSecret");
    }
}
