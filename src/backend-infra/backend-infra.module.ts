import { Module } from "@nestjs/common";
import { BackendInfraService } from "./backend-infra.service";
import { BackendInfraController } from './backend-infra.controller';

@Module({
    providers: [BackendInfraService],
    exports: [BackendInfraService],
    controllers: [BackendInfraController],
})
export class BackendInfraModule {}
