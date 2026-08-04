import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding test users for Staff, Student, Parent, Driver...");

  const passwordHash = await bcrypt.hash("Password@123", 10);

  // 1. Get or Create Roles
  const teacherRole = await prisma.role.findFirst({ where: { name: "Teacher" } });
  const driverRole = await prisma.role.upsert({
    where: { name: "Driver" },
    update: {},
    create: { name: "Driver", description: "Transport Driver", permissions: ["MANAGE_TRANSPORT", "VIEW_TRANSPORT", "read"] }
  });
  const transportManagerRole = await prisma.role.upsert({
    where: { name: "Transport Manager" },
    update: {},
    create: { name: "Transport Manager", description: "Runs the whole transport fleet", permissions: ["MANAGE_TRANSPORT", "MANAGE_TRANSPORT_FLEET", "VIEW_REPORTS"] }
  });

  // 2. Create Teacher
  if (teacherRole) {
    await prisma.staff.upsert({
      where: { email: "teacher@school.com" },
      update: {},
      create: {
        email: "teacher@school.com",
        passwordHash,
        fullName: "Jane Teacher",
        roleId: teacherRole.id,
      }
    });
    console.log("✅ Created Staff/Teacher: teacher@school.com (Password@123)");
  }

  // 3. Create Driver
  await prisma.staff.upsert({
    where: { email: "driver@school.com" },
    update: {},
    create: {
      email: "driver@school.com",
      passwordHash,
      fullName: "Dave Driver",
      roleId: driverRole.id,
    }
  });
  console.log("✅ Created Staff/Driver: driver@school.com (Password@123)");

  // 3b. Create Transport Manager
  await prisma.staff.upsert({
    where: { email: "transport-manager@school.com" },
    update: {},
    create: {
      email: "transport-manager@school.com",
      passwordHash,
      fullName: "Tina Manager",
      roleId: transportManagerRole.id,
    }
  });
  console.log("✅ Created Staff/Transport Manager: transport-manager@school.com (Password@123)");

  // 4. Create Student & PortalAccount
  const student = await prisma.student.upsert({
    where: { admissionNumber: "STU-001" },
    update: {},
    create: {
      admissionNumber: "STU-001",
      fullName: "Alex Student",
      gender: "Male",
      guardianName: "Bob Parent",
      phone: "+1234567890",
      passwordHash // Fallback
    }
  });
  
  await prisma.portalAccount.upsert({
    where: { username: "student@school.com" },
    update: { referenceId: student.id },
    create: {
      username: "student@school.com",
      passwordHash,
      userType: "STUDENT",
      referenceId: student.id,
    }
  });
  console.log("✅ Created Student Portal Account: student@school.com (Password@123)");

  // 5. Create Parent & PortalAccount
  const parent = await prisma.parent.upsert({
    where: { email: "parent@school.com" },
    update: {},
    create: {
      name: "Bob Parent",
      email: "parent@school.com",
      phone: "+1987654321",
      passwordHash // Fallback
    }
  });

  await prisma.portalAccount.upsert({
    where: { username: "parent@school.com" },
    update: { referenceId: parent.id },
    create: {
      username: "parent@school.com",
      passwordHash,
      userType: "PARENT",
      referenceId: parent.id,
    }
  });
  console.log("✅ Created Parent Portal Account: parent@school.com (Password@123)");

  console.log("Test users seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
