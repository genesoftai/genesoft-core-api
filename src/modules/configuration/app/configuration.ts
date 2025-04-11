import { registerAs } from "@nestjs/config";

export default registerAs("app", () => ({
    port: parseInt(process.env.PORT, 10) || 8000,
    genesoftApiKey: process.env.GENESOFT_API_KEY,
    databaseUrl: process.env.DATABASE_URL,
    databaseHost: process.env.DATABASE_HOST,
    databasePort: process.env.DATABASE_PORT,
    databaseUser: process.env.DATABASE_USER,
    databasePassword: process.env.DATABASE_PASSWORD,
    databaseName: process.env.DATABASE_NAME,
    genesoftWebBaseUrl: process.env.GENESOFT_WEB_BASE_URL,
    nodeEnv: process.env.NODE_ENV,
    freeTierIterationsLimit: process.env.FREE_TIER_ITERATIONS_LIMIT || 10,
    startupTierIterationsLimit: process.env.STARTUP_TIER_ITERATIONS_LIMIT || 40,
    githubWebhookUrl: process.env.GITHUB_WEBHOOK_URL,
    githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
}));
