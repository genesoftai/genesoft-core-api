import { Test, TestingModule } from "@nestjs/testing";
import { CodebaseService } from "./codebase.service";

describe("CodebaseService", () => {
    let service: CodebaseService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [CodebaseService],
        }).compile();

        service = module.get<CodebaseService>(CodebaseService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });
});
