import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class KoyebConfigurationService {
    constructor(private configService: ConfigService) {}

    get koyebApiKey() {
        return this.configService.get("koyeb.koyebApiKey");
    }

    get koyebAppId() {
        return this.configService.get("koyeb.koyebAppId");
    }
}
