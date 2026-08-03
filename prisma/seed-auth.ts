import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const STANDARD_PERMISSIONS = {
  ADMIN: [
    "MANAGE_USERS", "MANAGE_ROLES", "MANAGE_ACADEMICS", "MANAGE_FEES", "MANAGE_EXAMS", "VIEW_REPORTS", "*"
  ],
  TEACHER: [
    "VIEW_STUDENTS", "MARK_ATTENDANCE", "MANAGE_GRADES", "MANAGE_LMS_CONTENT", "VIEW_OWN_SCHEDULE", "MANAGE_EXAMS", "read"
  ],
  STUDENT: [
    "VIEW_OWN_PROFILE", "VIEW_OWN_GRADES", "VIEW_LMS_CONTENT", "SUBMIT_ASSIGNMENTS", "VIEW_OWN_SCHEDULE"
  ],
  PARENT: [
    "VIEW_CHILD_PROFILE", "VIEW_CHILD_GRADES", "PAY_FEES", "VIEW_CHILD_SCHEDULE"
  ]
};

async function main() {
  console.log("Starting Unified Auth Role Seeding...");

  // 1. Upsert Super Admin Role
  const adminRole = await prisma.role.upsert({
    where: { name: "Super Admin" },
    update: {
      permissions: {
        push: STANDARD_PERMISSIONS.ADMIN
      }
    },
    create: {
      name: "Super Admin",
      description: "Full system access",
      permissions: STANDARD_PERMISSIONS.ADMIN,
    }
  });
  console.log(`✅ Role: Super Admin (Permissions: ${adminRole.permissions.length})`);

  // Ensure 'Super Admin' has a clean distinct array in case of duplicates from push
  await prisma.role.update({
    where: { id: adminRole.id },
    data: { permissions: Array.from(new Set(adminRole.permissions)) }
  });

  // 2. Upsert Teacher Role
  const teacherRole = await prisma.role.upsert({
    where: { name: "Teacher" },
    update: {
      permissions: { push: STANDARD_PERMISSIONS.TEACHER }
    },
    create: {
      name: "Teacher",
      description: "Standard instructional staff",
      permissions: STANDARD_PERMISSIONS.TEACHER,
    }
  });
  await prisma.role.update({
    where: { id: teacherRole.id },
    data: { permissions: Array.from(new Set(teacherRole.permissions)) }
  });
  console.log(`✅ Role: Teacher (Permissions: ${teacherRole.permissions.length})`);

  // 3. Upsert Student Role
  const studentRole = await prisma.role.upsert({
    where: { name: "Student" },
    update: {
      permissions: { push: STANDARD_PERMISSIONS.STUDENT }
    },
    create: {
      name: "Student",
      description: "Student portal access",
      permissions: STANDARD_PERMISSIONS.STUDENT,
    }
  });
  await prisma.role.update({
    where: { id: studentRole.id },
    data: { permissions: Array.from(new Set(studentRole.permissions)) }
  });
  console.log(`✅ Role: Student`);

  // 4. Upsert Parent Role
  const parentRole = await prisma.role.upsert({
    where: { name: "Parent" },
    update: {
      permissions: { push: STANDARD_PERMISSIONS.PARENT }
    },
    create: {
      name: "Parent",
      description: "Parent portal access",
      permissions: STANDARD_PERMISSIONS.PARENT,
    }
  });
  await prisma.role.update({
    where: { id: parentRole.id },
    data: { permissions: Array.from(new Set(parentRole.permissions)) }
  });
  console.log(`✅ Role: Parent`);

  // 5. Ensure there is at least one admin account
  const adminEmail = "admin@school.com";
  const existingAdmin = await prisma.staff.findUnique({ where: { email: adminEmail } });
  
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("Admin@123", 10);
    await prisma.staff.create({
      data: {
        email: adminEmail,
        passwordHash,
        fullName: "System Administrator",
        roleId: adminRole.id,
      }
    });
    console.log(`✅ Created fallback admin: ${adminEmail} (Admin@123)`);
  }

  console.log("Unified Auth Seeding Complete! 🚀");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
