// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding portal accounts...");
  
  // 1. Get an existing student
  let student = await prisma.student.findFirst({
    include: { enrollments: true }
  });

  if (!student || student.enrollments.length === 0) {
    console.log("No student found. Creating a mock student...");
    const section = await prisma.section.findFirst();
    const session = await prisma.academicSession.findFirst();
    if (!section || !session) throw new Error("No section or session found");

    student = await prisma.student.create({
      data: {
        admissionNumber: "STU-001",
        fullName: "Mock Student",
        gender: "Male",
        guardianName: "Mock Parent",
        phone: "9999999999",
        enrollments: {
          create: {
            sectionId: section.id,
            sessionId: session.id,
            status: "Active"
          }
        }
      },
      include: { enrollments: true }
    });
  }

  // 2. Create a Parent
  const parent = await prisma.parent.create({
    data: {
      name: student.guardianName || "Demo Parent",
      email: "parent@example.com",
      phone: student.phone || "1234567890"
    }
  });
  console.log(`Created parent: ${parent.name}`);

  // 3. Link Parent to Student
  await prisma.parentStudent.create({
    data: {
      parentId: parent.id,
      enrollmentId: student.enrollments[0].id,
      relationship: "Father"
    }
  });

  // 4. Create Portal Accounts
  // Student Portal Account
  await prisma.portalAccount.create({
    data: {
      username: student.admissionNumber, // e.g. STU-001
      passwordHash: await bcrypt.hash("password123", 10),
      userType: "STUDENT",
      referenceId: student.id
    }
  });
  console.log(`Created student portal account: ${student.admissionNumber} / password123`);

  // Parent Portal Account
  await prisma.portalAccount.create({
    data: {
      username: parent.email || "parent@example.com",
      passwordHash: await bcrypt.hash("password123", 10),
      userType: "PARENT",
      referenceId: parent.id
    }
  });
  console.log(`Created parent portal account: ${parent.email} / password123`);

  console.log("Seeding complete!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
