import { registerAs } from "@nestjs/config";

export default registerAs("thirdParty", () => ({
    resendApiKey: process.env.RESEND_API_KEY || "",
    resendGenesoftEmailAudienceId:
        process.env.RESEND_GENESOFT_EMAIL_AUDIENCE_ID || "",
    exaApiKey: process.env.EXA_API_KEY || "",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
}));
