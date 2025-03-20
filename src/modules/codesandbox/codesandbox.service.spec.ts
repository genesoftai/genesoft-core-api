import { Test, TestingModule } from "@nestjs/testing";
import { CodesandboxService } from "./codesandbox.service";

describe("CodesandboxService", () => {
    let service: CodesandboxService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [CodesandboxService],
        }).compile();

        service = module.get<CodesandboxService>(CodesandboxService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });
});
