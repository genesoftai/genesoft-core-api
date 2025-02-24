import { Test, TestingModule } from '@nestjs/testing';
import { BusinessLogicController } from './business-logic.controller';

describe('BusinessLogicController', () => {
  let controller: BusinessLogicController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessLogicController],
    }).compile();

    controller = module.get<BusinessLogicController>(BusinessLogicController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
