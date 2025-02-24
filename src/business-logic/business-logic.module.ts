import { Logger, Module } from "@nestjs/common";
import { BusinessLogicController } from "./business-logic.controller";
import { BusinessLogicService } from "./business-logic.service";
import { AiAgentConfigurationModule } from "@/modules/configuration/ai-agent";
import { HttpModule } from "@nestjs/axios";
import { BusinessLogicAIAgentRequest } from "./entity/business-logic-ai-agent-request.entity";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [
        AiAgentConfigurationModule,
        HttpModule,
        TypeOrmModule.forFeature([BusinessLogicAIAgentRequest]),
    ],
    controllers: [BusinessLogicController],
    providers: [BusinessLogicService, Logger],
    exports: [BusinessLogicService],
})
export class BusinessLogicModule {}
