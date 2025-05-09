import { Logger, Module } from "@nestjs/common";
import { FigmaController } from "./figma.controller";
import { FigmaService } from "./figma.service";
import { HttpModule } from "@nestjs/axios";
import { ThirdPartyConfigurationModule } from "../configuration/third-party";
import { FigmaFile } from "./entity/figma-file.entity";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [
        HttpModule,
        ThirdPartyConfigurationModule,
        TypeOrmModule.forFeature([FigmaFile]),
    ],
    controllers: [FigmaController],
    providers: [FigmaService, Logger],
    exports: [FigmaService],
})
export class FigmaModule {}
