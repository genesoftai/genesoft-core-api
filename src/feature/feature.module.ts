import { forwardRef, Logger, Module } from "@nestjs/common";
import { FeatureController } from "./feature.controller";
import { FeatureService } from "./feature.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Feature } from "@/modules/project/entity/feature.entity";
import { ConversationModule } from "@/conversation/conversation.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Feature]),
        forwardRef(() => ConversationModule),
    ],
    controllers: [FeatureController],
    providers: [FeatureService, Logger],
    exports: [FeatureService],
})
export class FeatureModule {}
