import { Test, TestingModule } from '@nestjs/testing';
import { FrontendInfraController } from './frontend-infra.controller';

describe('FrontendInfraController', () => {
  let controller: FrontendInfraController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FrontendInfraController],
    }).compile();

    controller = module.get<FrontendInfraController>(FrontendInfraController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
