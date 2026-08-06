import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiService],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns an honest not_configured result instead of fabricating an AI response', async () => {
    const result = await service.infer('summarize-student-360', {
      studentId: 'abc',
    });

    expect(result).toEqual({
      status: 'not_configured',
      task: 'summarize-student-360',
    });
  });
});
