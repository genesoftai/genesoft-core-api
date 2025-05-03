import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { PageService } from "./page.service";
import { CreatePageDto } from "./dto/create-page.dto";
import { Page } from "@/modules/project/entity/page.entity";

@Controller("page")
export class PageController {
    constructor(private readonly pageService: PageService) {}

    @Post()
    async createPage(@Body() payload: CreatePageDto): Promise<Page> {
        return this.pageService.createPage(payload);
    }

    @Get(":id")
    async getPage(@Param("id") id: string): Promise<Page> {
        return this.pageService.getPage(id);
    }
}
