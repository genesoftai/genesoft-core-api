import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class SupabaseConfigurationService {
    constructor(private configService: ConfigService) {}

    get supabaseUrl() {
        return this.configService.get("supabase.supabaseUrl");
    }

    get supabaseAnonKey() {
        return this.configService.get("supabase.supabaseAnonKey");
    }

    get supabaseServiceRoleKey() {
        return this.configService.get("supabase.supabaseServiceRoleKey");
    }
}
