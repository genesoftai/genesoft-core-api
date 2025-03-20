import { registerAs } from "@nestjs/config";

export default registerAs("thirdParty", () => ({
    resendApiKey: process.env.RESEND_API_KEY || "",
    resendGenesoftEmailAudienceId:
        process.env.RESEND_GENESOFT_EMAIL_AUDIENCE_ID || "",
    exaApiKey: process.env.EXA_API_KEY || "",
    codesandboxApiKey: process.env.CSB_API_KEY || "",
    gcpApiKey: process.env.GCP_API_KEY || "",
    gcpOrganizationId: process.env.GCP_ORGANIZATION_ID || "",
}));
