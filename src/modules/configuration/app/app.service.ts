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
}
