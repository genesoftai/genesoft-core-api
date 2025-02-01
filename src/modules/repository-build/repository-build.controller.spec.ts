import { Test, TestingModule } from "@nestjs/testing";
import { RepositoryBuildController } from "./repository-build.controller";

describe("RepositoryBuildController", () => {
    let controller: RepositoryBuildController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [RepositoryBuildController],
        }).compile();

        controller = module.get<RepositoryBuildController>(
            RepositoryBuildController,
        );
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });
});
