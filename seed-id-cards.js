const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Seeding ID Card Templates...');
  
  // Student Template
  let studentTemplate = await prisma.idCardTemplate.findFirst({ where: { targetRole: 'Student' } });
  if (!studentTemplate) {
    studentTemplate = await prisma.idCardTemplate.create({
      data: {
        templateName: 'Standard Student ID',
        targetRole: 'Student',
        primaryColor: '#3b82f6',
        secondaryColor: '#1e40af',
      }
    });
  }

  // Staff Template
  let staffTemplate = await prisma.idCardTemplate.findFirst({ where: { targetRole: 'Staff' } });
  if (!staffTemplate) {
    staffTemplate = await prisma.idCardTemplate.create({
      data: {
        templateName: 'Standard Staff ID',
        targetRole: 'Staff',
        primaryColor: '#ef4444', // Red for staff
        secondaryColor: '#991b1b',
      }
    });
  }

  const dummyImage = 'https://i.pravatar.cc/300?img=';

  console.log('Fetching Students...');
  const students = await prisma.student.findMany();
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    // Update photo
    await prisma.student.update({
      where: { id: student.id },
      data: { photoUrl: student.photoUrl || dummyImage + (i % 70) }
    });

    // Check if ID card exists
    const existing = await prisma.idCard.findFirst({ where: { studentId: student.id } });
    if (!existing) {
      await prisma.idCard.create({
        data: {
          idNumber: 'STU-' + Math.floor(100000 + Math.random() * 900000),
          templateId: studentTemplate.id,
          studentId: student.id,
          barcodeData: student.id
        }
      });
    }
  }

  console.log('Fetching Staff...');
  const staff = await prisma.staff.findMany();
  for (let i = 0; i < staff.length; i++) {
    const s = staff[i];
    // Update photo
    await prisma.staff.update({
      where: { id: s.id },
      data: { photoUrl: s.photoUrl || dummyImage + ((i + 30) % 70) }
    });

    const existing = await prisma.idCard.findFirst({ where: { staffId: s.id } });
    if (!existing) {
      await prisma.idCard.create({
        data: {
          idNumber: 'EMP-' + Math.floor(10000 + Math.random() * 90000),
          templateId: staffTemplate.id,
          staffId: s.id,
          barcodeData: s.id
        }
      });
    }
  }

  console.log(`Seeded ID cards for ${students.length} students and ${staff.length} staff members.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
