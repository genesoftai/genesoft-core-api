import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class ThirdPartyConfigurationService {
    constructor(private configService: ConfigService) {}

    get resendApiKey() {
        return this.configService.get("thirdParty.resendApiKey");
    }

    get resendGenesoftEmailAudienceId() {
        return this.configService.get(
            "thirdParty.resendGenesoftEmailAudienceId",
        );
    }

    get exaApiKey() {
        return this.configService.get("thirdParty.exaApiKey");
    }

    get codesandboxApiKey() {
        return this.configService.get("thirdParty.codesandboxApiKey");
    }

    get gcpApiKey() {
        return this.configService.get("thirdParty.gcpApiKey");
    }

    get gcpOrganizationId() {
        return this.configService.get("thirdParty.gcpOrganizationId");
    }

    get perplexityApiKey() {
        return this.configService.get("thirdParty.perplexityApiKey");
    }

    get figmaAccessToken() {
        return this.configService.get("thirdParty.figmaAccessToken");
    }
}
