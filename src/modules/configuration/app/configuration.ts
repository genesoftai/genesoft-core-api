import { registerAs } from "@nestjs/config";

export default registerAs("app", () => ({
    port: parseInt(process.env.PORT, 10) || 8000,
    genesoftApiKey: process.env.GENESOFT_API_KEY,
}));
