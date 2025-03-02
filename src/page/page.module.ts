import { forwardRef, Logger, Module } from "@nestjs/common";
import { PageController } from "./page.controller";
import { PageService } from "./page.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Page } from "@/modules/project/entity/page.entity";
import { ConversationModule } from "@/conversation/conversation.module";
@Module({
    imports: [
        TypeOrmModule.forFeature([Page]),
        forwardRef(() => ConversationModule),
    ],
    controllers: [PageController],
    providers: [PageService, Logger],
    exports: [PageService],
})
export class PageModule {}
