import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OwnershipService } from './ownership.service';
import { PrismaService } from '../prisma/prisma.service';

describe('OwnershipService', () => {
  let service: OwnershipService;

  const mockPrisma = {
    parentStudent: { findUnique: jest.fn() },
    studentEnrollment: { findUnique: jest.fn() },
    hostelOutpass: { findUnique: jest.fn() },
    schoolDiaryEntry: { findUnique: jest.fn() },
    consentResponse: { findUnique: jest.fn() },
    reportCard: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OwnershipService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<OwnershipService>(OwnershipService);
  });

  describe('assertOwnsStudent', () => {
    it('allows a student accessing their own record', async () => {
      await expect(
        service.assertOwnsStudent(
          { userId: 'stu-1', role: 'Student' },
          'stu-1',
        ),
      ).resolves.toBeUndefined();
    });

    it('rejects a student accessing another student record', async () => {
      await expect(
        service.assertOwnsStudent(
          { userId: 'stu-1', role: 'Student' },
          'stu-2',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows a parent linked to the student', async () => {
      mockPrisma.parentStudent.findUnique.mockResolvedValue({ id: 'link-1' });
      await expect(
        service.assertOwnsStudent(
          { userId: 'parent-1', role: 'Parent' },
          'stu-1',
        ),
      ).resolves.toBeUndefined();
    });

    it('rejects a parent with no link to the student', async () => {
      mockPrisma.parentStudent.findUnique.mockResolvedValue(null);
      await expect(
        service.assertOwnsStudent(
          { userId: 'parent-1', role: 'Parent' },
          'stu-1',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects any other role outright', async () => {
      await expect(
        service.assertOwnsStudent({ userId: 'staff-1', role: 'Teacher' }, 'stu-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('assertOwnsEnrollment', () => {
    it('rejects when enrollmentId is undefined', async () => {
      await expect(
        service.assertOwnsEnrollment(
          { userId: 'stu-1', role: 'Student' },
          undefined,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects when the enrollment does not exist', async () => {
      mockPrisma.studentEnrollment.findUnique.mockResolvedValue(null);
      await expect(
        service.assertOwnsEnrollment(
          { userId: 'stu-1', role: 'Student' },
          'enr-missing',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows the student who owns the resolved enrollment', async () => {
      mockPrisma.studentEnrollment.findUnique.mockResolvedValue({
        studentId: 'stu-1',
      });
      await expect(
        service.assertOwnsEnrollment(
          { userId: 'stu-1', role: 'Student' },
          'enr-1',
        ),
      ).resolves.toBeUndefined();
    });

    it("rejects a student whose id doesn't match the enrollment's student", async () => {
      mockPrisma.studentEnrollment.findUnique.mockResolvedValue({
        studentId: 'stu-2',
      });
      await expect(
        service.assertOwnsEnrollment(
          { userId: 'stu-1', role: 'Student' },
          'enr-1',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it("allows a parent linked to the enrollment's student", async () => {
      mockPrisma.studentEnrollment.findUnique.mockResolvedValue({
        studentId: 'stu-1',
      });
      mockPrisma.parentStudent.findUnique.mockResolvedValue({ id: 'link-1' });
      await expect(
        service.assertOwnsEnrollment(
          { userId: 'parent-1', role: 'Parent' },
          'enr-1',
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('assertOwnsHostelOutpass', () => {
    it('rejects when outpassId is undefined', async () => {
      await expect(
        service.assertOwnsHostelOutpass(
          { userId: 'stu-1', role: 'Student' },
          undefined,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects when the outpass does not exist', async () => {
      mockPrisma.hostelOutpass.findUnique.mockResolvedValue(null);
      await expect(
        service.assertOwnsHostelOutpass(
          { userId: 'stu-1', role: 'Student' },
          'op-missing',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('resolves outpass -> enrollment -> student and allows the owner', async () => {
      mockPrisma.hostelOutpass.findUnique.mockResolvedValue({
        enrollmentId: 'enr-1',
      });
      mockPrisma.studentEnrollment.findUnique.mockResolvedValue({
        studentId: 'stu-1',
      });
      await expect(
        service.assertOwnsHostelOutpass(
          { userId: 'stu-1', role: 'Student' },
          'op-1',
        ),
      ).resolves.toBeUndefined();
    });

    it('rejects a student who does not own the outpass', async () => {
      mockPrisma.hostelOutpass.findUnique.mockResolvedValue({
        enrollmentId: 'enr-1',
      });
      mockPrisma.studentEnrollment.findUnique.mockResolvedValue({
        studentId: 'stu-2',
      });
      await expect(
        service.assertOwnsHostelOutpass(
          { userId: 'stu-1', role: 'Student' },
          'op-1',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('assertOwnsDiaryEntry', () => {
    it('rejects when entryId is undefined', async () => {
      await expect(
        service.assertOwnsDiaryEntry(
          { userId: 'parent-1', role: 'Parent' },
          undefined,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects when the diary entry does not exist', async () => {
      mockPrisma.schoolDiaryEntry.findUnique.mockResolvedValue(null);
      await expect(
        service.assertOwnsDiaryEntry(
          { userId: 'parent-1', role: 'Parent' },
          'entry-missing',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it("allows a parent linked to the entry's student", async () => {
      mockPrisma.schoolDiaryEntry.findUnique.mockResolvedValue({
        studentId: 'stu-1',
      });
      mockPrisma.parentStudent.findUnique.mockResolvedValue({ id: 'link-1' });
      await expect(
        service.assertOwnsDiaryEntry(
          { userId: 'parent-1', role: 'Parent' },
          'entry-1',
        ),
      ).resolves.toBeUndefined();
    });

    it("rejects a parent not linked to the entry's student", async () => {
      mockPrisma.schoolDiaryEntry.findUnique.mockResolvedValue({
        studentId: 'stu-1',
      });
      mockPrisma.parentStudent.findUnique.mockResolvedValue(null);
      await expect(
        service.assertOwnsDiaryEntry(
          { userId: 'parent-1', role: 'Parent' },
          'entry-1',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('assertOwnsConsentResponse', () => {
    it('rejects when responseId is undefined', async () => {
      await expect(
        service.assertOwnsConsentResponse(
          { userId: 'parent-1', role: 'Parent' },
          undefined,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects when the consent response does not exist', async () => {
      mockPrisma.consentResponse.findUnique.mockResolvedValue(null);
      await expect(
        service.assertOwnsConsentResponse(
          { userId: 'parent-1', role: 'Parent' },
          'resp-missing',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it("allows a parent linked to the response's student", async () => {
      mockPrisma.consentResponse.findUnique.mockResolvedValue({
        studentId: 'stu-1',
      });
      mockPrisma.parentStudent.findUnique.mockResolvedValue({ id: 'link-1' });
      await expect(
        service.assertOwnsConsentResponse(
          { userId: 'parent-1', role: 'Parent' },
          'resp-1',
        ),
      ).resolves.toBeUndefined();
    });

    it("rejects a parent not linked to the response's student", async () => {
      mockPrisma.consentResponse.findUnique.mockResolvedValue({
        studentId: 'stu-1',
      });
      mockPrisma.parentStudent.findUnique.mockResolvedValue(null);
      await expect(
        service.assertOwnsConsentResponse(
          { userId: 'parent-1', role: 'Parent' },
          'resp-1',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('assertOwnsReportCard', () => {
    it('rejects when reportCardId is undefined', async () => {
      await expect(
        service.assertOwnsReportCard(
          { userId: 'parent-1', role: 'Parent' },
          undefined,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects when the report card does not exist', async () => {
      mockPrisma.reportCard.findUnique.mockResolvedValue(null);
      await expect(
        service.assertOwnsReportCard(
          { userId: 'parent-1', role: 'Parent' },
          'rc-missing',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it("resolves report card -> enrollment -> student and allows the owner", async () => {
      mockPrisma.reportCard.findUnique.mockResolvedValue({ enrollmentId: 'enr-1' });
      mockPrisma.studentEnrollment.findUnique.mockResolvedValue({ studentId: 'stu-1' });
      await expect(
        service.assertOwnsReportCard(
          { userId: 'stu-1', role: 'Student' },
          'rc-1',
        ),
      ).resolves.toBeUndefined();
    });

    it('rejects a student who does not own the report card', async () => {
      mockPrisma.reportCard.findUnique.mockResolvedValue({ enrollmentId: 'enr-1' });
      mockPrisma.studentEnrollment.findUnique.mockResolvedValue({ studentId: 'stu-2' });
      await expect(
        service.assertOwnsReportCard(
          { userId: 'stu-1', role: 'Student' },
          'rc-1',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
