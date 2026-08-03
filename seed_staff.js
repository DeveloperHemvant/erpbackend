const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const firstNames = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Ayaan", "Krishna", "Ishaan", "Shaurya", "Atharv", "Ananya", "Saanvi", "Aditi", "Isha", "Riya", "Aarohi", "Anika", "Diya", "Avni", "Kavya", "Rahul", "Priya", "Neha", "Amit", "Rohan", "Sneha", "Karan", "Pooja", "Vikram"];
const lastNames = ["Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Das", "Yadav", "Chauhan", "Rajput", "Iyer", "Jain", "Bhat", "Nair", "Reddy", "Menon", "Joshi", "Kapoor", "Malhotra", "Mehta", "Bose", "Ghosh"];

function generateName() {
  const f = firstNames[Math.floor(Math.random() * firstNames.length)];
  const l = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${f} ${l}`;
}

async function main() {
  console.log("Starting Staff Onboarding Seeding...");
  
  const schoolProfile = await prisma.schoolProfile.findFirst();
  if (!schoolProfile) {
    throw new Error("No School Profile found. Please seed master data first.");
  }

  const session = await prisma.academicSession.findFirst({ where: { name: '2026-2027' } });
  if (!session) {
    throw new Error("Session 2026-2027 not found.");
  }

  const rolesList = ["Teacher", "Driver", "Conductor", "HR", "Accountant", "Librarian", "Principal", "Parent"];
  const roleMap = {};

  console.log("Ensuring roles exist...");
  for (const roleName of rolesList) {
    let r = await prisma.role.findUnique({ where: { name: roleName } });
    if (!r) {
      r = await prisma.role.create({
        data: {
          name: roleName,
          description: `${roleName} Role`,
          permissions: ['basic_access'],
          schoolProfileId: schoolProfile.id
        }
      });
    }
    roleMap[roleName] = r.id;
  }

  const passwordHash = await bcrypt.hash("12345678", 10);
  
  console.log("Generating 70 Staff Members...");
  const staffData = [];
  const teachersList = [];
  
  for (let i = 1; i <= 70; i++) {
    const fullName = generateName();
    let roleName = "Teacher"; // Default majority
    
    if (i <= 5) roleName = "Driver";
    else if (i <= 10) roleName = "Conductor";
    else if (i <= 12) roleName = "HR";
    else if (i <= 15) roleName = "Accountant";
    else if (i === 16) roleName = "Librarian";
    else if (i === 17) roleName = "Principal";
    // Remaining ~53 will be Teachers

    const email = `${fullName.replace(" ", ".").toLowerCase()}.${i}@school.com`;
    
    staffData.push({
      email,
      fullName,
      passwordHash,
      roleId: roleMap[roleName],
      gender: Math.random() > 0.5 ? 'Male' : 'Female'
    });
  }

  const createdStaff = await prisma.$transaction(
    staffData.map(s => prisma.staff.create({ data: s }))
  );

  for (const s of createdStaff) {
    if (s.roleId === roleMap["Teacher"]) {
      teachersList.push(s);
    }
  }

  console.log(`Created ${createdStaff.length} staff members (${teachersList.length} Teachers).`);
  console.log("Mapping Teachers to Subjects and Classes...");

  const sections = await prisma.section.findMany({ include: { class: true } });
  const subjects = await prisma.subject.findMany();

  let teacherIndex = 0;
  
  // 1. Assign Class Teachers (1 for each section)
  for (const sec of sections) {
    const t = teachersList[teacherIndex % teachersList.length];
    
    await prisma.teacherAssignment.create({
      data: {
        staffId: t.id,
        sessionId: session.id,
        sectionId: sec.id,
        isClassTeacher: true
      }
    });
    teacherIndex++;
  }

  console.log(`Assigned ${sections.length} Class Teachers.`);

  // 2. Assign Subject Teachers (Every section needs all 6 subjects taught)
  let subjectAssignmentsCount = 0;
  for (const sec of sections) {
    for (const sub of subjects) {
      const t = teachersList[teacherIndex % teachersList.length];
      
      await prisma.teacherAssignment.create({
        data: {
          staffId: t.id,
          sessionId: session.id,
          sectionId: sec.id,
          subjectId: sub.id,
          isClassTeacher: false
        }
      });
      teacherIndex++;
      subjectAssignmentsCount++;
    }
  }

  console.log(`Assigned ${subjectAssignmentsCount} Subject-Teacher mappings.`);
  console.log("Staff Onboarding successfully completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
