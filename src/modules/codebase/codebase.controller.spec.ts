import { Test, TestingModule } from "@nestjs/testing";
import { CodebaseController } from "./codebase.controller";

describe("CodebaseController", () => {
    let controller: CodebaseController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CodebaseController],
        }).compile();

        controller = module.get<CodebaseController>(CodebaseController);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });
});
