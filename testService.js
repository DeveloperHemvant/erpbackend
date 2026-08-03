const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getStaffDashboard(staffId) {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        role: true,
        assignments: {
          include: {
            section: { include: { class: true } },
            subject: true
          }
        },
        TransportVehicleStaff: {
          include: {
            vehicle: true
          }
        }
      }
    });

    if (!staff) throw new Error("Staff not found");

    const widgets = {};

    const today = new Date().toLocaleDateString("en-US", { weekday: 'long' });
    
    const timetable = await prisma.timetablePeriod.findMany({
      where: {
        teacherId: staff.id,
        dayOfWeek: today
      },
      include: {
        subject: true,
        section: { include: { class: true } },
        room: true
      },
      orderBy: { startTime: 'asc' }
    });

    if (timetable.length > 0 || (staff.assignments && staff.assignments.length > 0)) {
      widgets.timetableWidget = {
        assignments: staff.assignments || [],
        todaySchedule: timetable
      };
    }

    if (staff.TransportVehicleStaff && staff.TransportVehicleStaff.length > 0) {
      const vehicleId = staff.TransportVehicleStaff[0].vehicleId;
      const activeTrip = await prisma.transportTrip.findFirst({
        where: { vehicleId, status: "In Progress" },
        include: { route: true }
      });
      
      widgets.transportTripWidget = {
        vehicleAssignments: staff.TransportVehicleStaff,
        activeTrip
      };
    }

    if (staff.role?.name === 'Super Admin' || staff.role?.name === 'Admin') {
      widgets.adminStatsWidget = {
        totalStudents: await prisma.student.count(),
        totalStaff: await prisma.staff.count(),
        totalRevenue: 245000 
      };
    }

    if (staff.assignments && staff.assignments.some(ta => ta.isClassTeacher)) {
      const classTeacherAssignments = staff.assignments.filter(ta => ta.isClassTeacher);
      
      const sections = await prisma.section.findMany({
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
  } catch (error) {
    console.error("SERVICE ERROR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const staff = await prisma.staff.findUnique({ where: { email: 'classteacher@gmail.com' } });
  if (staff) {
    const result = await getStaffDashboard(staff.id);
    console.log(JSON.stringify(result, null, 2));
  }
}

main();
