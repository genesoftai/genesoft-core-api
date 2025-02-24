import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AiAgentConfigurationService {
    constructor(private configService: ConfigService) {}

    get genesoftAiAgentServiceBaseUrl() {
        return this.configService.get("aiAgent.genesoftAiAgentServiceBaseUrl");
    }

    get genesoftAiAgentServiceApiKey() {
        return this.configService.get("aiAgent.genesoftAiAgentServiceApiKey");
    }
}
