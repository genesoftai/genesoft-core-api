import { registerAs } from "@nestjs/config";

export default registerAs("github", () => ({
    githubAccessToken: process.env.GITHUB_ACCESS_TOKEN,
    githubBaseApiEndpoint: process.env.GITHUB_BASE_API_ENDPOINT,
    githubOwner: process.env.GITHUB_OWNER,
}));
