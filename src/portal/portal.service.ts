// @ts-nocheck
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PortalService {
  constructor(private prisma: PrismaService) {}

  async getStudentDashboard(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          include: {
            section: { include: { class: true } },
            attendance: true,
            examMarks: { include: { examSlot: { include: { exam: true, subject: true } } } },
            reportCards: { include: { exam: true } },
            invoices: true
          }
        }
      }
    });

    if (!student) throw new NotFoundException("Student not found");

    // We take the active enrollment
    const activeEnr = student.enrollments[0];
    if (!activeEnr) return { student };

    // Fetch upcoming exams for this class
    const upcomingExams = await this.prisma.examSlot.findMany({
      where: { classId: activeEnr.section.classId },
      include: { exam: true, subject: true },
      orderBy: { date: "asc" },
      take: 5
    });

    // Fetch today's timetable — joins the teacher via the period's TeacherAssignment
    // so parents/students can see who is actually teaching each period, not just the
    // subject name, and can tell which period is happening right now.
    const today = new Date().toLocaleDateString("en-US", { weekday: 'long' });
    const rawTimetable = await this.prisma.timetablePeriod.findMany({
      where: { sectionId: activeEnr.sectionId, dayOfWeek: today },
      include: {
        subject: true,
        assignment: { include: { staff: { select: { id: true, fullName: true, photoUrl: true } } } }
      },
      orderBy: { startTime: "asc" }
    });
    const nowHHMM = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const timetable = rawTimetable.map((p) => ({
      ...p,
      teacher: p.assignment?.staff ? { id: p.assignment.staff.id, fullName: p.assignment.staff.fullName, photoUrl: p.assignment.staff.photoUrl } : null,
      isNow: p.startTime <= nowHHMM && nowHHMM < p.endTime,
    }));

    // Compute basic attendance %
    let present = 0;
    activeEnr.attendance.forEach(a => { if (a.status === "Present" || a.status === "Late") present++; });
    const attendanceRate = activeEnr.attendance.length ? (present / activeEnr.attendance.length) * 100 : 100;

    // Get recent attendance logs (last 5)
    const recentAttendance = [...activeEnr.attendance]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // Fetch class teacher (TeacherAssignment for this section with subjectId = null, or just any teacher if not found)
    const assignments = await this.prisma.teacherAssignment.findMany({
      where: { sectionId: activeEnr.sectionId },
      include: { staff: true, subject: true }
    });
    
    // Attempt to find the main class teacher (subjectId is null), fallback to first teacher
    const classTeacherAssignment = assignments.find(a => !a.subjectId) || assignments[0];
    const classTeacher = classTeacherAssignment ? classTeacherAssignment.staff : null;
    
    // Subject teachers
    const subjectTeachers = assignments
      .filter(a => a.subjectId)
      .map(a => ({ subject: a.subject?.name, teacher: a.staff.fullName, teacherId: a.staff.id }));

    // Fetch transport assignment
    const transport = await this.prisma.transportStudentAssignment.findFirst({
      where: { enrollmentId: activeEnr.id, status: "Active" },
      include: {
        route: {
          include: {
            stops: { orderBy: { orderIndex: 'asc' } },
            TransportTrip: {
              take: 1,
              orderBy: { date: 'desc' },
              include: {
                vehicle: { include: { staff: { include: { staff: true } } } },
                driver: true,
                logs: { orderBy: { timestamp: 'desc' }, take: 1 }
              }
            }
          }
        },
        stop: true
      }
    });

    return {
      student: {
        id: student.id,
        fullName: student.fullName,
        admissionNumber: student.admissionNumber,
        gender: student.gender,
        phone: student.phone,
        photoUrl: student.photoUrl,
        dateOfBirth: student.dateOfBirth,
        documentsVerified: student.documentsVerified,
        documentDetails: student.documentDetails
      },
      enrollment: activeEnr,
      attendanceRate: attendanceRate.toFixed(1),
      upcomingExams,
      timetable,
      reportCards: activeEnr.reportCards,
      pendingInvoices: activeEnr.invoices.filter((i) => i.status !== "Paid"),
      recentAttendance,
      classTeacher: classTeacher ? {
        id: classTeacher.id,
        name: classTeacher.fullName,
        email: classTeacher.email,
        phone: classTeacher.phone
      } : null,
      subjectTeachers,
      transport
    };
  }

  async getParentDashboard(parentId: string) {
    const parent = await this.prisma.parent.findUnique({
      where: { id: parentId },
      include: { students: { include: { student: true } } }
    });

    if (!parent) throw new NotFoundException("Parent not found");

    // getStudentDashboard already computes pendingInvoices — reused as-is here
    // so a direct student login gets the exact same shape as a parent-mediated one.
    const childrenData = await Promise.all(parent.students.map(ps => this.getStudentDashboard(ps.student.id)));

    return {
      parent: {
        id: parent.id,
        name: parent.name,
        email: parent.email,
        phone: parent.phone
      },
      children: childrenData
    };
  }

  async getStaffDashboard(staffId: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        role: true,
        assignments: {
          include: {
            section: { include: { class: true } },
            subject: true
          }
        },
        transportAssignments: {
          include: {
            vehicle: true
          }
        }
      }
    });

    if (!staff) throw new NotFoundException("Staff not found");

    const widgets: any = {};

    // 1. Timetable Widget (If they have teacher assignments or periods)
    const today = new Date().toLocaleDateString("en-US", { weekday: 'long' });
    const assignmentIds = staff.assignments ? staff.assignments.map(a => a.id) : [];
    
    let timetable: any[] = [];
    if (assignmentIds.length > 0) {
      timetable = await this.prisma.timetablePeriod.findMany({
        where: {
          assignmentId: { in: assignmentIds },
          dayOfWeek: today
        },
        include: {
          subject: true,
          section: { include: { class: true } }
        },
        orderBy: { startTime: 'asc' }
      });
    }

    if (timetable.length > 0 || (staff.assignments && staff.assignments.length > 0)) {
      widgets.timetableWidget = {
        assignments: staff.assignments || [],
        todaySchedule: timetable
      };
    }

    // 2. Transport Driver/Conductor Widget
    if (staff.transportAssignments && staff.transportAssignments.length > 0) {
      const vehicleAssignments = staff.transportAssignments;
      const vehicleId = vehicleAssignments[0].vehicleId;

      // Find active trip for the vehicle they are assigned to
      const activeTrip = await this.prisma.transportTrip.findFirst({
        where: { vehicleId: vehicleId, status: 'In Progress' },
        include: { route: { include: { stops: { orderBy: { orderIndex: 'asc' } } } }, logs: { orderBy: { timestamp: 'desc' }, take: 1 } }
      });

      const pastTrips = await this.prisma.transportTrip.findMany({
        where: { vehicleId: vehicleId, status: 'Completed' },
        include: { route: true, logs: { include: { stop: true }, orderBy: { timestamp: 'desc' } } },
        orderBy: { date: 'desc' },
        take: 20
      });
      
      const allRoutes = await this.prisma.transportRoute.findMany({
        where: { vehicleId },
        orderBy: { routeName: 'asc' }
      });
      
      const vehicleStaff = await this.prisma.transportVehicleStaff.findMany({
        where: { vehicleId },
        include: { staff: true, vehicle: true }
      });

      widgets.transportTripWidget = {
        vehicleAssignments: staff.transportAssignments,
        vehicleStaff,
        activeTrip,
        pastTrips,
        availableRoutes: allRoutes
      };
    }

    // 3. Admin/Basic Stats Widget (For Super Admin or specific roles)
    if (staff.role?.name === 'Super Admin' || staff.role?.name === 'Admin') {
      widgets.adminStatsWidget = {
        totalStudents: await this.prisma.student.count(),
        totalStaff: await this.prisma.staff.count(),
        totalRevenue: 245000 // Mock value for Phase 3
      };
    }

    // 4. Class Teacher Widget
    if (staff.assignments && staff.assignments.some(ta => ta.isClassTeacher)) {
      const classTeacherAssignments = staff.assignments.filter(ta => ta.isClassTeacher);
      
      // Get the full section details for these assignments
      const sections = await this.prisma.section.findMany({
        where: { id: { in: classTeacherAssignments.map(ta => ta.sectionId) } },
        include: { class: true }
      });
      
      widgets.classTeacherWidget = {
        sections
      };
    }

    return {
      staff: {
        id: staff.id,
        fullName: staff.fullName,
        role: staff.role?.name
      },
      widgets
    };
  }

  async getStudentAttendanceLogs(studentId: string) {
    // Find active enrollment
    const activeEnr = await this.prisma.studentEnrollment.findFirst({
      where: { studentId, status: "Enrolled" },
      orderBy: { createdAt: "desc" }
    });
    if (!activeEnr) return [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return this.prisma.attendanceRecord.findMany({
      where: {
        enrollmentId: activeEnr.id,
        createdAt: { gte: thirtyDaysAgo }
      },
      orderBy: { date: 'desc' }
    });
  }

  async applyStudentLeave(studentId: string, data: { leaveType: string, startDate: string, endDate: string, reason?: string }) {
    // Find active enrollment
    const activeEnr = await this.prisma.studentEnrollment.findFirst({
      where: { studentId, status: "Enrolled" },
      orderBy: { createdAt: "desc" }
    });
    
    if (!activeEnr) throw new NotFoundException("Active enrollment not found for student");

    return this.prisma.studentLeaveApplication.create({
      data: {
        enrollmentId: activeEnr.id,
        leaveType: data.leaveType,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        reason: data.reason
      }
    });
  }

  async getClassTeacherDesk(staffId: string, sectionId: string) {
    const todayStr = new Date().toISOString().split('T')[0];

    // Get all students enrolled in this section
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: { sectionId },
      include: {
        student: true,
        // Include today's attendance record
        attendance: {
          where: { date: todayStr }
        },
        // Check for today's leaves
        studentLeaveApplications: {
          where: {
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
            status: "Approved"
          }
        },
        // Check transport attendance for today
        TransportAttendance: {
          where: {
            timestamp: { gte: new Date(new Date().setHours(0,0,0,0)) }
          },
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      },
      orderBy: { student: { fullName: 'asc' } }
    });

    const students = enrollments.map(enr => {
      let suggestedStatus = 'Present'; // Default
      
      // If marked absent in transport
      if (enr.TransportAttendance.length > 0) {
        if (enr.TransportAttendance[0].status === 'Absent') {
          suggestedStatus = 'Absent';
        } else if (enr.TransportAttendance[0].status === 'Boarded' || enr.TransportAttendance[0].status === 'Dropped') {
          suggestedStatus = 'Present';
        }
      }

      // If approved leave
      if (enr.studentLeaveApplications.length > 0) {
        suggestedStatus = 'Leave';
      }

      return {
        enrollmentId: enr.id,
        studentId: enr.student.id,
        fullName: enr.student.fullName,
        photoUrl: enr.student.photoUrl,
        todayAttendance: enr.attendance.length > 0 ? enr.attendance[0].status : null,
        suggestedStatus
      };
    });

    // Get pending leaves for this section
    const pendingLeaves = await this.prisma.studentLeaveApplication.findMany({
      where: {
        enrollment: { sectionId },
        status: "Pending"
      },
      include: {
        enrollment: { include: { student: true } }
      },
      orderBy: { appliedAt: 'desc' }
    });

    return {
      students,
      pendingLeaves
    };
  }

  async submitClassAttendance(staffId: string, data: { sectionId: string, date: string, attendance: { enrollmentId: string, status: string }[] }) {
    const results = await Promise.all(data.attendance.map(async (record) => {
      // Upsert attendance for each student
      const existing = await this.prisma.attendanceRecord.findFirst({
        where: { enrollmentId: record.enrollmentId, date: data.date }
      });

      if (existing) {
        return this.prisma.attendanceRecord.update({
          where: { id: existing.id },
          data: { status: record.status, updatedBy: staffId }
        });
      }

      return this.prisma.attendanceRecord.create({
        data: {
          enrollmentId: record.enrollmentId,
          date: data.date,
          status: record.status,
          createdBy: staffId
        }
      });
    }));

    return { message: "Attendance submitted successfully", count: results.length };
  }

  async getClassAttendanceHistory(staffId: string, sectionId: string) {
    const records = await this.prisma.attendanceRecord.findMany({
      where: { enrollment: { sectionId } },
      include: { enrollment: { include: { student: true } } },
      orderBy: { date: 'desc' }
    });

    const historyMap: Record<string, any> = {};

    for (const r of records) {
      if (!historyMap[r.date]) {
        historyMap[r.date] = {
          date: r.date,
          present: 0,
          absent: 0,
          leave: 0,
          students: []
        };
      }

      if (r.status === 'Present') historyMap[r.date].present++;
      else if (r.status === 'Absent') historyMap[r.date].absent++;
      else if (r.status === 'Leave') historyMap[r.date].leave++;

      historyMap[r.date].students.push({
        fullName: r.enrollment.student.fullName,
        status: r.status
      });
    }

    return Object.values(historyMap).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async resolveStudentLeave(staffId: string, leaveId: string, data: { status: string, remarks?: string }) {
    return this.prisma.studentLeaveApplication.update({
      where: { id: leaveId },
      data: {
        status: data.status,
        resolvedAt: new Date(),
        resolvedById: staffId
      }
    });
  }
}
