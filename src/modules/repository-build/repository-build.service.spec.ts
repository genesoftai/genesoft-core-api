import { Test, TestingModule } from '@nestjs/testing';
import { RepositoryBuildService } from './repository-build.service';

describe('RepositoryBuildService', () => {
  let service: RepositoryBuildService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RepositoryBuildService],
    }).compile();

    service = module.get<RepositoryBuildService>(RepositoryBuildService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
