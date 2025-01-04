import { Logger, Module } from "@nestjs/common";
import { AppConfigurationModule } from "../configuration/app";
import { AuthGuard } from "./auth.guard";

@Module({
    imports: [AppConfigurationModule],
    providers: [AuthGuard, Logger],
    exports: [AuthGuard, AppConfigurationModule, Logger],
})
export class AuthModule {}
