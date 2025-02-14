import { Test, TestingModule } from '@nestjs/testing';
import { FrontendInfraService } from './frontend-infra.service';

describe('FrontendInfraService', () => {
  let service: FrontendInfraService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FrontendInfraService],
    }).compile();

    service = module.get<FrontendInfraService>(FrontendInfraService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
