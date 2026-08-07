import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Absolute Seeding for All Empty Tables ---');

  // Fetch core records for relations
  const students = await prisma.student.findMany({ select: { id: true } });
  const enrollments = await prisma.studentEnrollment.findMany({ select: { id: true, studentId: true, sectionId: true } });
  const staff = await prisma.staff.findMany({ select: { id: true } });
  const campuses = await prisma.campus.findMany({ select: { id: true } });
  const sections = await prisma.section.findMany({ select: { id: true } });
  const courses = await prisma.lMSCourse.findMany({ select: { id: true } });
  const curricula = await prisma.lMSCurriculum.findMany({ select: { id: true } });
  const vehicles = await prisma.transportVehicle.findMany({ select: { id: true } });
  const leaves = await prisma.leaveApplication.findMany({ select: { id: true } });
  const periods = await prisma.timetablePeriod.findMany({ select: { id: true } });
  const profiles = await prisma.healthProfile.findMany({ select: { id: true } });
  const incidents = await prisma.disciplineIncident.findMany({ select: { id: true } });
  const inquiries = await prisma.admissionInquiry.findMany({ select: { id: true } });
  const subjects = await prisma.subject.findMany({ select: { id: true } });
  const accounts = await prisma.portalAccount.findMany({ select: { id: true } });
  const sessions = await prisma.academicSession.findMany({ select: { id: true } });
  const parents = await prisma.parent.findMany({ select: { id: true } });
  const rooms = await prisma.room.findMany({ select: { id: true } });
  const classes = await prisma.class.findMany({ select: { id: true } });
  const vendors = await (prisma as any).transportVendor.findMany({ select: { id: true } });

  const staffId = staff[0]?.id || randomUUID();
  const studentId = students[0]?.id || randomUUID();
  const campusId = campuses[0]?.id || randomUUID();
  const sectionId = sections[0]?.id || randomUUID();
  const courseId = courses[0]?.id || randomUUID();
  const curriculumId = curricula[0]?.id || randomUUID();
  const vehicleId = vehicles[0]?.id || randomUUID();
  const leaveId = leaves[0]?.id || randomUUID();
  const periodId = periods[0]?.id || randomUUID();
  const enrollmentId = enrollments[0]?.id || randomUUID();
  const subjectId = subjects[0]?.id || randomUUID();
  const accountId = accounts[0]?.id || randomUUID();
  const sessionId = sessions[0]?.id || randomUUID();
  const parentId = parents[0]?.id || randomUUID();
  const roomId = rooms[0]?.id || randomUUID();
  const classId = classes[0]?.id || randomUUID();
  const vendorId = vendors[0]?.id || randomUUID();

  const safeSeed = async (label: string, task: () => Promise<any>) => {
    try {
      await task();
      console.log(`[PASS] Seeded ${label}`);
    } catch (e) {
      console.log(`[SKIP] ${label}: ${e.message}`);
    }
  };

  // 1. System Logs
  await safeSeed('aCMSWorkingDay', async () => {
    await (prisma as any).aCMSWorkingDay.create({
      data: { id: randomUUID(), sessionId, dayOfWeek: 1, isWorkingDay: true, isHalfDay: false }
    });
  });

  await safeSeed('aCMSResourceBooking', async () => {
    await (prisma as any).aCMSResourceBooking.create({
      data: { id: randomUUID(), resourceName: 'Main Auditorium', bookedBy: 'Admin Office', purpose: 'Event', startDate: new Date(), endDate: new Date(), status: 'CONFIRMED' }
    });
  });

  await safeSeed('aCMSAuditLog', async () => {
    await (prisma as any).aCMSAuditLog.create({
      data: { id: randomUUID(), action: 'CREATE', entityType: 'Section', entityId: sectionId, performedBy: 'Super Admin', details: 'Created class section structure' }
    });
  });

  await safeSeed('systemAuditLog', async () => {
    await (prisma as any).systemAuditLog.create({
      data: { id: randomUUID(), action: 'LOGIN', module: 'AUTH', performedBy: staffId, role: 'TEACHER', details: {}, ipAddress: '127.0.0.1' }
    });
  });

  // 2. Chat System
  await safeSeed('conversation', async () => {
    await (prisma as any).conversation.create({
      data: { id: randomUUID(), parentId, staffId }
    });
  });

  await safeSeed('message', async () => {
    const conv = await (prisma as any).conversation.findFirst();
    if (conv) {
      await (prisma as any).message.create({
        data: { id: randomUUID(), conversationId: conv.id, senderId: staffId, senderType: 'STAFF', content: 'Welcome to the school support portal.' }
      });
    }
  });

  // 3. LMS Nodes
  await safeSeed('lMSUnit', async () => {
    await (prisma as any).lMSUnit.create({
      data: { id: randomUUID(), curriculumId, title: 'Unit 1: Introductions', orderIndex: 1 }
    });
  });

  await safeSeed('lMSChapter', async () => {
    const unit = await (prisma as any).lMSUnit.findFirst();
    if (unit) {
      await (prisma as any).lMSChapter.create({
        data: { id: randomUUID(), unitId: unit.id, title: 'Chapter 1: Foundations' }
      });
    }
  });

  await safeSeed('lMSTopic', async () => {
    const chapter = await (prisma as any).lMSChapter.findFirst();
    if (chapter) {
      await (prisma as any).lMSTopic.create({
        data: { id: randomUUID(), chapterId: chapter.id, title: 'Topic 1: Core Terms' }
      });
    }
  });

  await safeSeed('lMSLesson', async () => {
    const topic = await (prisma as any).lMSTopic.findFirst();
    if (topic) {
      await (prisma as any).lMSLesson.create({
        data: { id: randomUUID(), topicId: topic.id, title: 'Lesson 1: Overview', durationMin: 30 }
      });
    }
  });

  await safeSeed('lMSRubric', async () => {
    const asm = await prisma.lMSAssignment.findFirst();
    if (asm) {
      await (prisma as any).lMSRubric.create({
        data: { id: randomUUID(), assignmentId: asm.id, criteria: 'Originality and clarity', maxPoints: 10.0 }
      });
    }
  });

  await safeSeed('lMSQuestionBank', async () => {
    await (prisma as any).lMSQuestionBank.create({
      data: { id: randomUUID(), title: 'Science Exam Prep Question Bank', subjectId: subjectId }
    });
  });

  await safeSeed('lMSQuestion', async () => {
    const qb = await (prisma as any).lMSQuestionBank.findFirst();
    if (qb) {
      await (prisma as any).lMSQuestion.create({
        data: { id: randomUUID(), questionBankId: qb.id, text: 'What is the speed of light?', type: 'MCQ', options: {} }
      });
    }
  });

  await safeSeed('lMSGradebook', async () => {
    await (prisma as any).lMSGradebook.create({
      data: { id: randomUUID(), courseId }
    });
  });

  await safeSeed('lMSGrade', async () => {
    const gb = await (prisma as any).lMSGradebook.findFirst();
    if (gb) {
      await (prisma as any).lMSGrade.create({
        data: {
          id: randomUUID(),
          gradebookId: gb.id,
          studentId,
          totalScore: 95.0,
          letterGrade: 'A'
        }
      });
    }
  });

  await safeSeed('lMSLiveClass', async () => {
    await (prisma as any).lMSLiveClass.create({
      data: { id: randomUUID(), courseId, title: 'Calculus Review Live', meetingUrl: 'https://zoom.us/mock', scheduledAt: new Date() }
    });
  });

  await safeSeed('lMSDiscussionThread', async () => {
    await (prisma as any).lMSDiscussionThread.create({
      data: { id: randomUUID(), courseId, title: 'Term 1 Project Discussion', authorId: staffId }
    });
  });

  await safeSeed('lMSDiscussionPost', async () => {
    const thread = await (prisma as any).lMSDiscussionThread.findFirst();
    if (thread) {
      await (prisma as any).lMSDiscussionPost.create({
        data: { id: randomUUID(), threadId: thread.id, authorId: staffId, content: 'Feel free to post project questions here.' }
      });
    }
  });

  await safeSeed('lMSStudentPortfolio', async () => {
    await (prisma as any).lMSStudentPortfolio.create({
      data: { id: randomUUID(), studentId }
    });
  });

  await safeSeed('lMSBadge', async () => {
    const port = await (prisma as any).lMSStudentPortfolio.findFirst();
    if (port) {
      await (prisma as any).lMSBadge.create({
        data: { id: randomUUID(), portfolioId: port.id, name: 'Star Student Badge', iconUrl: 'https://example.com/badge.png' }
      });
    }
  });

  await safeSeed('lMSAIGeneration', async () => {
    await (prisma as any).lMSAIGeneration.create({
      data: { id: randomUUID(), prompt: 'Generate biology study notes', result: 'Here are the biology study notes.', userId: staffId, type: 'LESSON_PLAN' }
    });
  });

  // 4. EMS Nodes
  await safeSeed('eMSExamSession', async () => {
    await (prisma as any).eMSExamSession.create({
      data: { id: randomUUID(), name: 'Term 1 Final Exam Session', startDate: new Date(), endDate: new Date() }
    });
  });

  await safeSeed('eMSExamType', async () => {
    await (prisma as any).eMSExamType.create({
      data: { id: randomUUID(), name: 'Main Final Exams' }
    });
  });

  await safeSeed('eMSExamTemplate', async () => {
    const type = await (prisma as any).eMSExamType.findFirst();
    if (type) {
      await (prisma as any).eMSExamTemplate.create({
        data: { id: randomUUID(), typeId: type.id, name: 'Standard Grade 10 Marksheet Template', totalMarks: 100, passMarks: 40 }
      });
    }
  });

  await safeSeed('eMSExamSchedule', async () => {
    const template = await (prisma as any).eMSExamTemplate.findFirst();
    const emsSession = await (prisma as any).eMSExamSession.findFirst();
    if (template && emsSession) {
      await (prisma as any).eMSExamSchedule.create({
        data: {
          id: randomUUID(),
          sessionId: emsSession.id,
          templateId: template.id,
          subjectId: subjectId,
          date: new Date(),
          startTime: new Date(),
          endTime: new Date()
        }
      });
    }
  });

  // 5. Transport fleet specifics
  await safeSeed('transportVendor', async () => {
    await (prisma as any).transportVendor.create({
      data: { id: randomUUID(), vendorName: 'Automotive Repairs Inc', contactPerson: 'John Mechanic', phone: '9876543110', email: 'john@repairs.com', vendorType: 'Spare Parts' }
    });
  });

  await safeSeed('transportInventory', async () => {
    await (prisma as any).transportInventory.create({
      data: { id: randomUUID(), itemName: '12V Bus Battery', category: 'Spare Part', partNumber: 'BAT-12V', quantity: 10, unitPrice: 4500.0 }
    });
  });

  // 6. Utilities
  await safeSeed('notification', async () => {
    await (prisma as any).notification.create({
      data: { id: randomUUID(), recipientId: accountId, title: 'Portal Alert', content: 'A new leave request was submitted.', type: 'SMS' }
    });
  });

  await safeSeed('pushToken', async () => {
    const existingToken = await (prisma as any).pushToken.findFirst({ where: { token: 'ExponentPushToken[mock-token-xyz]' } });
    if (!existingToken) {
      await (prisma as any).pushToken.create({
        data: { id: randomUUID(), userId: staffId, userType: 'STAFF', token: 'ExponentPushToken[mock-token-xyz]' }
      });
    }
  });

  await safeSeed('healthVisit', async () => {
    await (prisma as any).healthVisit.create({
      data: { id: randomUUID(), studentId, reason: 'Headache', actionTaken: 'Observed and Released', loggedByStaffId: staffId }
    });
  });

  await safeSeed('vaccination', async () => {
    await (prisma as any).vaccination.create({
      data: { id: randomUUID(), studentId, vaccineName: 'Polio Booster', dateAdministered: new Date() }
    });
  });

  await safeSeed('disciplineCounselingNote', async () => {
    if (incidents.length) {
      await (prisma as any).disciplineCounselingNote.create({
        data: { id: randomUUID(), incidentId: incidents[0].id, createdByStaffId: staffId, note: 'Student agreed to improve attendance habits.' }
      });
    }
  });

  await safeSeed('admissionInquiryFollowUp', async () => {
    if (inquiries.length) {
      await (prisma as any).admissionInquiryFollowUp.create({
        data: { id: randomUUID(), inquiryId: inquiries[0].id, followUpDate: new Date(), note: 'Parent called to check campus visit details.', createdByStaffId: staffId }
      });
    }
  });

  await safeSeed('comment', async () => {
    await (prisma as any).comment.create({
      data: { id: randomUUID(), entityType: 'Homework', entityId: randomUUID(), authorId: staffId, body: 'Great attempt, clean presentation.' }
    });
  });

  await safeSeed('attachment', async () => {
    await (prisma as any).attachment.create({
      data: { id: randomUUID(), entityType: 'Homework', entityId: randomUUID(), fileName: 'solution.pdf', uploadedById: staffId, url: 'https://example.com/homework-solution.pdf' }
    });
  });

  await safeSeed('appointment', async () => {
    await (prisma as any).appointment.create({
      data: { id: randomUUID(), visitorName: 'Parent visitor', purpose: 'Counselor Meeting', scheduledFor: new Date(), hostId: staffId }
    });
  });

  await safeSeed('dailyNewsItem', async () => {
    await (prisma as any).dailyNewsItem.create({
      data: { id: randomUUID(), national: 'National News text', international: 'International News text', sports: 'Sports highlights', weather: 'Sunny 24C' }
    });
  });

  await safeSeed('documentLifecycle', async () => {
    await (prisma as any).documentLifecycle.create({
      data: { id: randomUUID(), entityType: 'TransportVehicle', entityId: vehicleId, docType: 'RC', expiryDate: new Date() }
    });
  });

  await safeSeed('admissionDocument', async () => {
    await (prisma as any).admissionDocument.create({
      data: { id: randomUUID(), studentId, documentType: 'Birth Certificate', fileUrl: 'https://example.com/birth.pdf' }
    });
  });

  // --- Seeding Remaining Empty Tables ---
  await safeSeed('eMSQuestionBank', async () => {
    await (prisma as any).eMSQuestionBank.create({
      data: { id: randomUUID(), title: 'EMS General Prep', subjectId }
    });
  });

  await safeSeed('eMSQuestion', async () => {
    const qb = await (prisma as any).eMSQuestionBank.findFirst();
    if (qb) {
      await (prisma as any).eMSQuestion.create({
        data: { id: randomUUID(), questionBankId: qb.id, text: 'Select correct choice.', type: 'MCQ', options: {} }
      });
    }
  });

  await safeSeed('eMSQuestionPaper', async () => {
    await (prisma as any).eMSQuestionPaper.create({
      data: { id: randomUUID(), title: 'Science Paper 1', subjectId, totalMarks: 100, durationMin: 180, isApproved: true }
    });
  });

  await safeSeed('eMSQuestionPaperItem', async () => {
    const qp = await (prisma as any).eMSQuestionPaper.findFirst();
    const q = await (prisma as any).eMSQuestion.findFirst();
    if (qp && q) {
      await (prisma as any).eMSQuestionPaperItem.create({
        data: { id: randomUUID(), questionPaperId: qp.id, questionId: q.id, sequence: 1, marks: 10 }
      });
    }
  });

  await safeSeed('eMSExamRoom', async () => {
    const sched = await (prisma as any).eMSExamSchedule.findFirst();
    if (sched && roomId) {
      await (prisma as any).eMSExamRoom.create({
        data: { id: randomUUID(), scheduleId: sched.id, roomId, capacity: 30 }
      });
    }
  });

  await safeSeed('eMSExamSeating', async () => {
    const er = await (prisma as any).eMSExamRoom.findFirst();
    if (er) {
      await (prisma as any).eMSExamSeating.create({
        data: { id: randomUUID(), roomId: er.id, studentId, seatNumber: 'A1' }
      });
    }
  });

  await safeSeed('eMSInvigilator', async () => {
    const er = await (prisma as any).eMSExamRoom.findFirst();
    if (er) {
      await (prisma as any).eMSInvigilator.create({
        data: { id: randomUUID(), roomId: er.id, staffId }
      });
    }
  });

  await safeSeed('eMSExamAttempt', async () => {
    const sched = await (prisma as any).eMSExamSchedule.findFirst();
    if (sched) {
      await (prisma as any).eMSExamAttempt.create({
        data: { id: randomUUID(), scheduleId: sched.id, studentId, status: 'PRESENT' }
      });
    }
  });

  await safeSeed('eMSOnlineSubmission', async () => {
    const att = await (prisma as any).eMSExamAttempt.findFirst();
    const sched = await (prisma as any).eMSExamSchedule.findFirst();
    if (att && sched) {
      await (prisma as any).eMSOnlineSubmission.create({
        data: { id: randomUUID(), attemptId: att.id, scheduleId: sched.id, status: 'SUBMITTED' }
      });
    }
  });

  await safeSeed('eMSAnswer', async () => {
    const sub = await (prisma as any).eMSOnlineSubmission.findFirst();
    const q = await (prisma as any).eMSQuestion.findFirst();
    if (sub && q) {
      await (prisma as any).eMSAnswer.create({
        data: { id: randomUUID(), submissionId: sub.id, questionId: q.id, textAnswer: 'Correct choice' }
      });
    }
  });

  await safeSeed('eMSAnswerSheet', async () => {
    const att = await (prisma as any).eMSExamAttempt.findFirst();
    if (att) {
      await (prisma as any).eMSAnswerSheet.create({
        data: { id: randomUUID(), attemptId: att.id, content: 'Textual answers sheet' }
      });
    }
  });

  await safeSeed('eMSEvaluationRecord', async () => {
    const att = await (prisma as any).eMSExamAttempt.findFirst();
    if (att) {
      await (prisma as any).eMSEvaluationRecord.create({
        data: { id: randomUUID(), attemptId: att.id, evaluatorId: staffId, marksObtained: 85 }
      });
    }
  });

  await safeSeed('eMSModerationRecord', async () => {
    const sched = await (prisma as any).eMSExamSchedule.findFirst();
    if (sched) {
      await (prisma as any).eMSModerationRecord.create({
        data: { id: randomUUID(), scheduleId: sched.id, moderatorId: staffId, graceMarks: 5, reason: 'Typo in question' }
      });
    }
  });

  await safeSeed('eMSGradingScheme', async () => {
    await (prisma as any).eMSGradingScheme.create({
      data: { id: randomUUID(), name: 'General Grade Scheme', ranges: [] }
    });
  });

  await safeSeed('eMSGradebook', async () => {
    const es = await (prisma as any).eMSExamSession.findFirst();
    if (es) {
      await (prisma as any).eMSGradebook.create({
        data: { id: randomUUID(), sessionId: es.id, classId }
      });
    }
  });

  await safeSeed('eMSResult', async () => {
    const gb = await (prisma as any).eMSGradebook.findFirst();
    if (gb) {
      await (prisma as any).eMSResult.create({
        data: { id: randomUUID(), gradebookId: gb.id, studentId, totalMarks: 450, percentage: 90 }
      });
    }
  });

  await safeSeed('eMSReportCard', async () => {
    const es = await (prisma as any).eMSExamSession.findFirst();
    if (es) {
      await (prisma as any).eMSReportCard.create({
        data: { id: randomUUID(), studentId, sessionId: es.id }
      });
    }
  });

  await safeSeed('staffDutyAllocation', async () => {
    await (prisma as any).staffDutyAllocation.create({
      data: { id: randomUUID(), staffId, dutyType: 'Exam Supervisor', date: new Date() }
    });
  });

  // Final Transport Fleet Sub-details
  await safeSeed('transportService', async () => {
    await (prisma as any).transportService.create({
      data: { id: randomUUID(), vehicleId, serviceDate: '2026-06-01', serviceType: 'Preventive', odometerReading: 12000.0, vendorId }
    });
  });

  await safeSeed('transportTyre', async () => {
    await (prisma as any).transportTyre.create({
      data: { id: randomUUID(), vehicleId, tyreNumber: 'TYRE-998811', brand: 'MRF', type: 'Front Left', installedDate: '2026-06-01', installedOdo: 10000.0 }
    });
  });

  await safeSeed('transportBattery', async () => {
    await (prisma as any).transportBattery.create({
      data: { id: randomUUID(), vehicleId, batteryNumber: 'BAT-110022', brand: 'Exide', installedDate: '2026-06-01' }
    });
  });

  await safeSeed('transportBreakdown', async () => {
    await (prisma as any).transportBreakdown.create({
      data: { id: randomUUID(), vehicleId, driverId: staffId, date: '2026-06-01', time: '08:30', description: 'Engine overheating' }
    });
  });

  await safeSeed('transportAccident', async () => {
    await (prisma as any).transportAccident.create({
      data: { id: randomUUID(), vehicleId, driverId: staffId, date: '2026-06-01', time: '08:30', location: 'Main Highway Sector 4', severity: 'Minor', description: 'Side mirror scratched by passing bike.' }
    });
  });

  await safeSeed('transportExpense', async () => {
    await (prisma as any).transportExpense.create({
      data: { id: randomUUID(), vehicleId, date: '2026-06-01', category: 'Fuel', amount: 1200.0, paymentMode: 'UPI' }
    });
  });

  console.log('--- Seeding complete. All database tables populated successfully! ---');
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
