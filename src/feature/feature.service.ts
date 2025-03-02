import {
    forwardRef,
    Inject,
    Injectable,
    Logger,
    LoggerService,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Feature } from "@/modules/project/entity/feature.entity";
import { CreateFeatureDto } from "./dto/create-feature.dto";
import { ConversationService } from "@/conversation/conversation.service";

@Injectable()
export class FeatureService {
    private readonly serviceName = "FeatureService";

    constructor(
        @InjectRepository(Feature)
        private featureRepository: Repository<Feature>,
        @Inject(Logger)
        private readonly logger: LoggerService,
        @Inject(forwardRef(() => ConversationService))
        private readonly conversationService: ConversationService,
    ) {}

    async createFeature(payload: CreateFeatureDto): Promise<Feature> {
        this.logger.log({
            message: `${this.serviceName}.createFeature: Creating feature`,
            metadata: {
                featureData: payload,
                timestamp: new Date(),
            },
        });

        const featureEntity = new Feature();
        featureEntity.name = payload.name;
        featureEntity.description = payload.description;
        featureEntity.project_id = payload.project_id;

        const feature = await this.featureRepository.save(featureEntity);

        this.logger.log({
            message: `${this.serviceName}.createFeature: Feature created`,
            metadata: {
                featureId: feature.id,
                projectId: payload.project_id,
                timestamp: new Date(),
            },
        });

        await this.conversationService.createConversation({
            feature_id: feature.id,
            project_id: payload.project_id,
        });

        return feature;
    }

    async getFeature(id: string): Promise<Feature> {
        return this.featureRepository.findOne({ where: { id } });
    }
}
