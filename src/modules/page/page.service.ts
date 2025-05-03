import { Page } from "@/modules/project/entity/page.entity";
import {
    forwardRef,
    Inject,
    Injectable,
    Logger,
    LoggerService,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreatePageDto } from "./dto/create-page.dto";
import { ConversationService } from "@/modules/conversation/conversation.service";

@Injectable()
export class PageService {
    private readonly serviceName = "PageService";

    constructor(
        @InjectRepository(Page)
        private pageRepository: Repository<Page>,
        @Inject(Logger)
        private readonly logger: LoggerService,
        @Inject(forwardRef(() => ConversationService))
        private readonly conversationService: ConversationService,
    ) {}

    async createPage(payload: CreatePageDto): Promise<Page> {
        this.logger.log({
            message: `${this.serviceName}.createPage: Creating page`,
            metadata: { pageData: payload, timestamp: new Date() },
        });

        const pageEntity = new Page();
        pageEntity.name = payload.name;
        pageEntity.description = payload.description;
        pageEntity.project_id = payload.project_id;

        const page = await this.pageRepository.save(pageEntity);

        this.logger.log({
            message: `${this.serviceName}.createPage: Page created`,
            metadata: {
                pageId: page.id,
                projectId: payload.project_id,
                timestamp: new Date(),
            },
        });

        await this.conversationService.createConversation({
            page_id: page.id,
            project_id: payload.project_id,
        });

        return page;
    }

    async getPage(id: string): Promise<Page> {
        return this.pageRepository.findOne({ where: { id } });
    }
}
