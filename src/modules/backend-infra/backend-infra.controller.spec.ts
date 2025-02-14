import { Test, TestingModule } from '@nestjs/testing';
import { BackendInfraController } from './backend-infra.controller';

describe('BackendInfraController', () => {
  let controller: BackendInfraController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BackendInfraController],
    }).compile();

    controller = module.get<BackendInfraController>(BackendInfraController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
