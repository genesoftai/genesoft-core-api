import { registerAs } from "@nestjs/config";

export default registerAs("vercel", () => ({
    vercelTeamId: process.env.VERCEL_TEAM_ID,
    vercelAccessToken: process.env.VERCEL_ACCESS_TOKEN,
}));
