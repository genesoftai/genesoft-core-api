import { Test, TestingModule } from '@nestjs/testing';
import { WebApplicationController } from './web-application.controller';

describe('WebApplicationController', () => {
  let controller: WebApplicationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebApplicationController],
    }).compile();

    controller = module.get<WebApplicationController>(WebApplicationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
