const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  let staff = await prisma.staff.findFirst({ where: { fullName: { contains: 'Aanya' } } });
  
  if (!staff) {
    console.error('Aanya not found');
    return;
  }

  const session = await prisma.academicSession.findFirst({ where: { isActive: true } }) || await prisma.academicSession.findFirst();
  let section = await prisma.section.findFirst({ include: { class: true }});
  
  let assignment = await prisma.teacherAssignment.findFirst({
    where: { staffId: staff.id }
  });

  if (!assignment) {
    assignment = await prisma.teacherAssignment.create({
      data: {
        staffId: staff.id,
        sessionId: session.id,
        sectionId: section.id,
        isClassTeacher: true,
        status: 'Active'
      }
    });
    console.log('Created assignment for Aanya to section:', section.name);
  } else {
    await prisma.teacherAssignment.update({
      where: { id: assignment.id },
      data: { isClassTeacher: true, sectionId: section.id }
    });
    console.log('Updated existing assignment for Aanya to isClassTeacher = true');
  }

  const today = new Date().toLocaleDateString("en-US", { weekday: 'long' });
  const subject = await prisma.subject.findFirst();
  
  let timetable = await prisma.timetable.findFirst();
  if (!timetable) {
     timetable = await prisma.timetable.create({ data: { name: "Default Timetable", sessionId: session.id, classId: section.classId, type: "Regular" }});
  }

  const existingPeriods = await prisma.timetablePeriod.findMany({
    where: { assignmentId: assignment.id, dayOfWeek: today }
  });

  if (existingPeriods.length === 0) {
    await prisma.timetablePeriod.createMany({
      data: [
        {
          timetableId: timetable.id,
          subjectId: subject?.id,
          sectionId: section.id,
          assignmentId: assignment.id,
          dayOfWeek: today,
          startTime: "09:00 AM",
          endTime: "09:45 AM",
          room: "Room 101"
        },
        {
          timetableId: timetable.id,
          subjectId: subject?.id,
          sectionId: section.id,
          assignmentId: assignment.id,
          dayOfWeek: today,
          startTime: "10:00 AM",
          endTime: "10:45 AM",
          room: "Room 101"
        }
      ]
    });
    console.log(`Created 2 Timetable periods for ${today} for Aanya`);
  } else {
    console.log(`Timetable periods already exist for Aanya on ${today}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
