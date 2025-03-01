import { Logger, Module } from "@nestjs/common";
import { PageController } from "./page.controller";
import { PageService } from "./page.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Page } from "@/modules/project/entity/page.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Page])],
    controllers: [PageController],
    providers: [PageService, Logger],
    exports: [PageService],
})
export class PageModule {}
