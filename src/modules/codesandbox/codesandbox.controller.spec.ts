import { Test, TestingModule } from "@nestjs/testing";
import { CodesandboxController } from "./codesandbox.controller";

describe("CodesandboxController", () => {
    let controller: CodesandboxController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CodesandboxController],
        }).compile();

        controller = module.get<CodesandboxController>(CodesandboxController);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });
});
