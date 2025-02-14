import { Test, TestingModule } from "@nestjs/testing";
import { BackendInfraService } from "./backend-infra.service";

describe("BackendInfraService", () => {
    let service: BackendInfraService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [BackendInfraService],
        }).compile();

        service = module.get<BackendInfraService>(BackendInfraService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });
});
