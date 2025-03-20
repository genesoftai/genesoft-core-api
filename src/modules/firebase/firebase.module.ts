import { Logger, Module } from "@nestjs/common";
import { FirebaseController } from "./firebase.controller";
import { FirebaseService } from "./firebase.service";
import { HttpModule } from "@nestjs/axios";
import { ThirdPartyConfigurationModule } from "../configuration/third-party";

@Module({
    imports: [HttpModule, ThirdPartyConfigurationModule],
    controllers: [FirebaseController],
    providers: [FirebaseService, Logger],
    exports: [FirebaseService],
})
export class FirebaseModule {}
