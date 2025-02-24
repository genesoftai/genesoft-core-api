import { registerAs } from "@nestjs/config";

export default registerAs("aiAgent", () => ({
    genesoftAiAgentServiceBaseUrl:
        process.env.GENESOFT_AI_AGENT_SERVICE_BASE_URL || "",
    genesoftAiAgentServiceApiKey:
        process.env.GENESOFT_AI_AGENT_SERVICE_API_KEY || "",
}));
