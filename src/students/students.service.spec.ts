import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentRepository } from './repositories/student.repository';
import type { TenantContext } from '../prisma/tenant-context';

describe('StudentsService — Campus Isolation Phase 3, Milestone 5', () => {
  let service: StudentsService;

  const mockRepo = {
    findByAdmissionNumber: jest.fn(),
    findParentByEmail: jest.fn(),
    createParent: jest.fn(),
    createPortalAccount: jest.fn(),
    create: jest.fn(),
    createParentStudentLink: jest.fn(),
    findAll: jest.fn(),
    findPage: jest.fn(),
    count: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findProfileById: jest.fn(),
    findActiveAcademicSession: jest.fn(),
    findFirstSectionByClass: jest.fn(),
    countEnrollmentsInSection: jest.fn(),
    findSectionWithClassGrade: jest.fn(),
    createEnrollment: jest.fn(),
    findEnrollmentByStudentAndSession: jest.fn(),
    findEnrollmentCampusIds: jest.fn(),
  };

  const restricted: TenantContext = {
    userId: 'staff-1',
    role: 'Teacher',
    permissions: ['MANAGE_USERS'],
    campusId: 'campus-a',
    canAccessAllCampuses: false,
    academicSessionId: 'session-1',
  };
  const unrestricted: TenantContext = {
    userId: 'admin-1',
    role: 'Super Admin',
    permissions: ['*'],
    campusId: null,
    canAccessAllCampuses: true,
    academicSessionId: 'session-1',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: StudentRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
  });

  describe('enrollStudent (via createStudent) — campusId derivation bug fix', () => {
    beforeEach(() => {
      mockRepo.findByAdmissionNumber.mockResolvedValue(null);
      mockRepo.findParentByEmail.mockResolvedValue({
        id: 'parent-1',
        name: 'Parent',
      });
      mockRepo.create.mockResolvedValue({ id: 'student-1', status: 'Active' });
      mockRepo.createParentStudentLink.mockResolvedValue(undefined);
      mockRepo.findActiveAcademicSession.mockResolvedValue({
        id: 'session-1',
      });
      mockRepo.countEnrollmentsInSection.mockResolvedValue(0);
      mockRepo.findSectionWithClassGrade.mockResolvedValue({
        id: 'section-1',
        name: 'A',
        class: { grade: 'Grade 5', campusId: 'campus-a' },
      });
    });

    it('explicitly sets campusId from the enrolled class, not left to ambient middleware', async () => {
      await service.createStudent({
        admissionNumber: 'ADM1',
        fullName: 'Test Student',
        status: 'Active',
        classId: 'class-1',
        sectionId: 'section-1',
        details: { emailId: 'p@test.com' },
      } as any);

      expect(mockRepo.createEnrollment).toHaveBeenCalledWith(
        expect.objectContaining({ campusId: 'campus-a' }),
      );
    });

    it('derives campusId correctly even when no section is explicitly provided (auto-picked section)', async () => {
      mockRepo.findFirstSectionByClass.mockResolvedValue({ id: 'section-2' });
      mockRepo.findSectionWithClassGrade.mockResolvedValue({
        id: 'section-2',
        name: 'B',
        class: { grade: 'Grade 6', campusId: 'campus-b' },
      });

      await service.createStudent({
        admissionNumber: 'ADM2',
        fullName: 'Test Student 2',
        status: 'Active',
        classId: 'class-2',
        details: { emailId: 'p2@test.com' },
      } as any);

      expect(mockRepo.createEnrollment).toHaveBeenCalledWith(
        expect.objectContaining({ campusId: 'campus-b' }),
      );
    });
  });

  describe('getStudents', () => {
    beforeEach(() => {
      mockRepo.findAll.mockResolvedValue([]);
      mockRepo.findPage.mockResolvedValue([]);
      mockRepo.count.mockResolvedValue(0);
    });

    it('threads tenantContext through to findAll when unpaginated', async () => {
      await service.getStudents(restricted);
      expect(mockRepo.findAll).toHaveBeenCalledWith(
        restricted,
        undefined,
        undefined,
      );
    });

    it('threads tenantContext through to findPage and count when paginated', async () => {
      await service.getStudents(restricted, 1, 10);
      expect(mockRepo.findPage).toHaveBeenCalledWith(
        0,
        10,
        restricted,
        undefined,
        undefined,
      );
      expect(mockRepo.count).toHaveBeenCalledWith(
        restricted,
        undefined,
        undefined,
      );
    });
  });

  describe('getStudentProfile — ownership check', () => {
    it('returns the profile when a restricted caller has a matching enrollment', async () => {
      mockRepo.findProfileById.mockResolvedValue({
        id: 's1',
        enrollments: [{ campusId: 'campus-a' }],
      });
      const result = await service.getStudentProfile('s1', restricted);
      expect(result.id).toBe('s1');
    });

    it('throws NotFoundException when restricted caller has no matching enrollment', async () => {
      mockRepo.findProfileById.mockResolvedValue({
        id: 's1',
        enrollments: [{ campusId: 'campus-b' }],
      });
      await expect(
        service.getStudentProfile('s1', restricted),
      ).rejects.toThrow(NotFoundException);
    });

    it('allows access regardless of campus for canAccessAllCampuses', async () => {
      mockRepo.findProfileById.mockResolvedValue({
        id: 's1',
        enrollments: [{ campusId: 'campus-b' }],
      });
      const result = await service.getStudentProfile('s1', unrestricted);
      expect(result.id).toBe('s1');
    });

    it('does not 404 a never-enrolled (Draft) student for a restricted caller', async () => {
      mockRepo.findProfileById.mockResolvedValue({ id: 's1', enrollments: [] });
      const result = await service.getStudentProfile('s1', restricted);
      expect(result.id).toBe('s1');
    });
  });

  describe('updateStudent / deleteStudent — ownership check', () => {
    it('updateStudent throws NotFoundException for a cross-campus restricted caller', async () => {
      mockRepo.findById.mockResolvedValue({ id: 's1' });
      mockRepo.findEnrollmentCampusIds.mockResolvedValue(['campus-b']);
      await expect(
        service.updateStudent('s1', {} as any, restricted),
      ).rejects.toThrow(NotFoundException);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it('deleteStudent throws NotFoundException for a cross-campus restricted caller', async () => {
      mockRepo.findEnrollmentCampusIds.mockResolvedValue(['campus-b']);
      await expect(service.deleteStudent('s1', restricted)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });

    it('deleteStudent succeeds for a same-campus restricted caller', async () => {
      mockRepo.findEnrollmentCampusIds.mockResolvedValue(['campus-a']);
      mockRepo.delete.mockResolvedValue({ id: 's1' });
      await service.deleteStudent('s1', restricted);
      expect(mockRepo.delete).toHaveBeenCalledWith('s1');
    });

    it('deleteStudent does not 404 a never-enrolled (Draft) student for a restricted caller', async () => {
      mockRepo.findEnrollmentCampusIds.mockResolvedValue([]);
      mockRepo.delete.mockResolvedValue({ id: 's1' });
      await service.deleteStudent('s1', restricted);
      expect(mockRepo.delete).toHaveBeenCalledWith('s1');
    });
  });
});
