import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 8000,
  curlentApiKey: process.env.CURLENT_API_KEY,
  freeTierMonthlyReportLimit: process.env.FREE_TIER_MONTHLY_REPORT_LIMIT,
}));
