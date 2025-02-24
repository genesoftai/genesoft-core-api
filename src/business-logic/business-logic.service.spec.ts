import { Test, TestingModule } from '@nestjs/testing';
import { BusinessLogicService } from './business-logic.service';

describe('BusinessLogicService', () => {
  let service: BusinessLogicService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BusinessLogicService],
    }).compile();

    service = module.get<BusinessLogicService>(BusinessLogicService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
