import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigurationService {
  constructor(private configService: ConfigService) {}

  get port() {
    return this.configService.get('app.port');
  }

  get curlentApiKey() {
    return this.configService.get('app.curlentApiKey');
  }

  get freeTierMonthlyReportLimit() {
    return this.configService.get('app.freeTierMonthlyReportLimit');
  }
}
