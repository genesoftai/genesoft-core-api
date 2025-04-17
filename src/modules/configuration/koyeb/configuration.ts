import { registerAs } from "@nestjs/config";

export default registerAs("koyeb", () => ({
    koyebApiKey: process.env.KOYEB_API_KEY,
    koyebAppId: process.env.KOYEB_APP_ID,
}));
