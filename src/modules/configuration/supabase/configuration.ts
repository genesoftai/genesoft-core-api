import { registerAs } from "@nestjs/config";

export default registerAs("supabase", () => ({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_SECRET,
}));
