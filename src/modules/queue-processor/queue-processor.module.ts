import { Module } from "@nestjs/common";
import { ProjectIntegrationProcessor } from "./project-integration.processor";

@Module({
    imports: [ ],
    providers: [ProjectIntegrationProcessor],
    exports: [],
})
export class QueueProcessorModule {}
