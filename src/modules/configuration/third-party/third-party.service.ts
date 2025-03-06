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
}
