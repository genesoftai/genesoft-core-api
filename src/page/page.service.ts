import { Page } from "@/modules/project/entity/page.entity";
import { Inject, Injectable, Logger, LoggerService } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreatePageDto } from "./dto/create-page.dto";

@Injectable()
export class PageService {
    private readonly serviceName = "PageService";

    constructor(
        @InjectRepository(Page)
        private pageRepository: Repository<Page>,
        @Inject(Logger)
        private readonly logger: LoggerService,
    ) {}

    async createPage(payload: CreatePageDto): Promise<Page> {
        this.logger.log({
            message: `${this.serviceName}.addPage: Adding page`,
            metadata: { pageData: payload, timestamp: new Date() },
        });

        const pageEntity = new Page();
        pageEntity.name = payload.name;
        pageEntity.description = payload.description;
        pageEntity.file_ids = payload.file_ids;
        pageEntity.reference_link_ids = payload.reference_link_ids;
        pageEntity.project_id = payload.project_id;

        const page = await this.pageRepository.save(pageEntity);

        this.logger.log({
            message: `${this.serviceName}.addPage: Page added`,
            metadata: {
                pageId: page.id,
                projectId: payload.project_id,
                timestamp: new Date(),
            },
        });

        return page;
    }

    async getPage(id: string): Promise<Page> {
        return this.pageRepository.findOne({ where: { id } });
    }
}
