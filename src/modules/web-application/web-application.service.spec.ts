import { Test, TestingModule } from '@nestjs/testing';
import { WebApplicationService } from './web-application.service';

describe('WebApplicationService', () => {
  let service: WebApplicationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebApplicationService],
    }).compile();

    service = module.get<WebApplicationService>(WebApplicationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
