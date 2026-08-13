import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from './comments.service';
import { CommentRepository } from './repositories/comment.repository';

describe('CommentsService', () => {
  let service: CommentsService;

  const mockRepository = {
    findByEntity: jest.fn(),
    create: jest.fn(),
  };

  const staffUser = {
    userId: 'staff-1',
    identifier: 's',
    role: 'Teacher',
    permissions: ['VIEW_STUDENTS'],
    campusId: 'campus-1',
    canAccessAllCampuses: false,
  };
  const unprivilegedUser = {
    userId: 'staff-2',
    identifier: 'u',
    role: 'Driver',
    permissions: [],
    campusId: 'campus-1',
    canAccessAllCampuses: false,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: CommentRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getComments', () => {
    it('returns comments when the caller has the entity-type view permission', async () => {
      mockRepository.findByEntity.mockResolvedValue([{ id: 'c1' }]);

      const result = await service.getComments(
        'student',
        'entity-1',
        staffUser,
      );

      expect(result).toEqual([{ id: 'c1' }]);
      expect(mockRepository.findByEntity).toHaveBeenCalledWith(
        'student',
        'entity-1',
      );
    });

    it('throws Forbidden when the caller lacks the entity-type view permission', async () => {
      await expect(
        service.getComments('student', 'entity-1', unprivilegedUser as any),
      ).rejects.toThrow(ForbiddenException);
      expect(mockRepository.findByEntity).not.toHaveBeenCalled();
    });
  });

  describe('createComment', () => {
    it('creates a comment attributed to the current user when permitted', async () => {
      mockRepository.create.mockResolvedValue({ id: 'c1', body: 'hello' });

      await service.createComment(
        { entityType: 'student', entityId: 'entity-1', body: 'hello' },
        staffUser,
      );

      expect(mockRepository.create).toHaveBeenCalledWith({
        entityType: 'student',
        entityId: 'entity-1',
        body: 'hello',
        authorId: 'staff-1',
      });
    });

    it('throws Forbidden when the caller lacks permission to comment on this entity type', async () => {
      await expect(
        service.createComment(
          { entityType: 'student', entityId: 'entity-1', body: 'hi' },
          unprivilegedUser as any,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
