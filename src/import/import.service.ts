import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import csv from 'csv-parser';
import { Readable } from 'stream';

@Injectable()
export class ImportService {
  constructor(private prisma: PrismaService) {}

  async processCsv(
    fileBuffer: Buffer,
    type: string,
    campusId: string,
    sessionId: string,
  ) {
    const results: any[] = [];

    return new Promise((resolve, reject) => {
      const stream = Readable.from(fileBuffer);

      stream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          void (async () => {
            try {
              let processed = 0;
              const errors: any[] = [];

              if (type === 'classes') {
                const res = await this.importClasses(
                  results,
                  campusId,
                  sessionId,
                );
                processed = res.processed;
                errors.push(...res.errors);
              } else if (type === 'staff') {
                const res = await this.importStaff(results, campusId);
                processed = res.processed;
                errors.push(...res.errors);
              } else if (type === 'students') {
                const res = await this.importStudents(
                  results,
                  campusId,
                  sessionId,
                );
                processed = res.processed;
                errors.push(...res.errors);
              } else {
                throw new BadRequestException('Invalid import type');
              }

              resolve({
                success: true,
                totalRows: results.length,
                processed,
                failed: errors.length,
                errors,
              });
            } catch (error: any) {
              reject(new BadRequestException(error.message));
            }
          })();
        })
        .on('error', () => {
          reject(new BadRequestException('Error parsing CSV file'));
        });
    });
  }

  private async importClasses(
    data: any[],
    campusId: string,
    sessionId: string,
  ) {
    let processed = 0;
    const errors: any[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.grade || !row.section) {
          errors.push({ row: i + 1, error: 'Missing grade or section' });
          continue;
        }

        // Find or create class
        let classRecord = await this.prisma.class.findFirst({
          where: { grade: row.grade, campusId, sessionId },
        });

        if (!classRecord) {
          classRecord = await this.prisma.class.create({
            data: { grade: row.grade, campusId, sessionId },
          });
        }

        // Find or create section
        const sectionRecord = await this.prisma.section.findFirst({
          where: { name: row.section, classId: classRecord.id },
        });

        if (!sectionRecord) {
          await this.prisma.section.create({
            data: { name: row.section, classId: classRecord.id },
          });
        }

        processed++;
      } catch (err: any) {
        errors.push({ row: i + 1, error: err.message });
      }
    }
    return { processed, errors };
  }

  private async importStaff(data: any[], _campusId: string) {
    let processed = 0;
    const errors: any[] = [];

    // Default Role Fallback
    let defaultRole = await this.prisma.role.findFirst({
      where: { name: 'Teacher' },
    });
    if (!defaultRole) {
      defaultRole = await this.prisma.role.findFirst();
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.email || !row.fullName) {
          errors.push({ row: i + 1, error: 'Missing email or fullName' });
          continue;
        }

        let roleId = defaultRole?.id;
        if (row.role) {
          const role = await this.prisma.role.findFirst({
            where: { name: { equals: row.role, mode: 'insensitive' } },
          });
          if (role) roleId = role.id;
        }

        if (!roleId) {
          errors.push({ row: i + 1, error: 'Valid role not found' });
          continue;
        }

        // Create user / staff
        const existing = await this.prisma.staff.findUnique({
          where: { email: row.email },
        });
        if (existing) {
          errors.push({ row: i + 1, error: 'Email already exists' });
          continue;
        }

        await this.prisma.staff.create({
          data: {
            email: row.email,
            fullName: row.fullName,
            passwordHash: 'hashed_temp_password', // Mock hash
            roleId: roleId,
          },
        });

        processed++;
      } catch (err: any) {
        errors.push({ row: i + 1, error: err.message });
      }
    }
    return { processed, errors };
  }

  private async importStudents(
    data: any[],
    campusId: string,
    sessionId: string,
  ) {
    let processed = 0;
    const errors: any[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (
          !row.admissionNumber ||
          !row.fullName ||
          !row.grade ||
          !row.section
        ) {
          errors.push({
            row: i + 1,
            error:
              'Missing required fields (admissionNumber, fullName, grade, section)',
          });
          continue;
        }

        // Look up class and section
        const classRecord = await this.prisma.class.findFirst({
          where: { grade: row.grade, campusId, sessionId },
        });
        if (!classRecord) {
          errors.push({ row: i + 1, error: `Class ${row.grade} not found` });
          continue;
        }

        const sectionRecord = await this.prisma.section.findFirst({
          where: { name: row.section, classId: classRecord.id },
        });
        if (!sectionRecord) {
          errors.push({
            row: i + 1,
            error: `Section ${row.section} not found`,
          });
          continue;
        }

        const existing = await this.prisma.student.findUnique({
          where: { admissionNumber: row.admissionNumber },
        });
        if (existing) {
          errors.push({
            row: i + 1,
            error: `Admission Number ${row.admissionNumber} already exists`,
          });
          continue;
        }

        const student = await this.prisma.student.create({
          data: {
            admissionNumber: row.admissionNumber,
            fullName: row.fullName,
            gender: row.gender || 'Unknown',
            guardianName: row.guardianName || 'Unknown',
            phone: row.phone || '0000000000',
          },
        });

        await this.prisma.studentEnrollment.create({
          data: {
            studentId: student.id,
            sessionId: sessionId,
            sectionId: sectionRecord.id,
            campusId: campusId,
            rollNumber: row.rollNumber || null,
          },
        });

        // PARENT LINKING (Step 5 of onboarding)
        if (row.parentEmail) {
          let parent = await this.prisma.parent.findUnique({
            where: { email: row.parentEmail },
          });
          if (!parent) {
            parent = await this.prisma.parent.create({
              data: {
                name: row.guardianName || 'Parent',
                email: row.parentEmail,
                phone: row.phone,
              },
            });
          }

          const enrollment = await this.prisma.studentEnrollment.findFirst({
            where: { studentId: student.id, sessionId },
          });
          if (enrollment) {
            await this.prisma.parentStudent.create({
              data: {
                parentId: parent.id,
                studentId: student.id,
                relationship: 'Guardian',
              },
            });
          }
        }

        processed++;
      } catch (err: any) {
        errors.push({ row: i + 1, error: err.message });
      }
    }
    return { processed, errors };
  }
}
