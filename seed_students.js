const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const firstNames = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Ayaan", "Krishna", "Ishaan", "Shaurya", "Atharv", "Ananya", "Saanvi", "Aditi", "Isha", "Riya", "Aarohi", "Anika", "Diya", "Avni", "Kavya", "Rahul", "Priya", "Neha", "Amit", "Rohan", "Sneha", "Karan", "Pooja", "Vikram"];
const lastNames = ["Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Das", "Yadav", "Chauhan", "Rajput", "Iyer", "Jain", "Bhat", "Nair", "Reddy", "Menon", "Joshi", "Kapoor", "Malhotra", "Mehta", "Bose", "Ghosh"];

function generateName() {
  const f = firstNames[Math.floor(Math.random() * firstNames.length)];
  const l = lastNames[Math.floor(Math.random() * lastNames.length)];
  return { first: f, last: l, full: `${f} ${l}` };
}

function generatePhone() {
  return '9' + Math.floor(Math.random() * 900000000 + 100000000).toString();
}

async function main() {
  console.log("Starting Student & Parent Seeding...");
  
  const campus = await prisma.campus.findUnique({ where: { name: 'Main Campus' } });
  const session = await prisma.academicSession.findUnique({ where: { name: '2026-2027' } });
  const sections = await prisma.section.findMany({ include: { class: true } });

  if (!campus || !session || sections.length === 0) {
    throw new Error("Missing master data! Please run seed_master_data.js first.");
  }

  const passwordHash = await bcrypt.hash("12345678", 10);
  
  console.log("Generating 500 Parents...");
  const parentData = [];
  for (let i = 1; i <= 500; i++) {
    const pName = generateName();
    parentData.push({
      name: pName.full,
      email: `parent${i}@school.com`,
      phone: generatePhone(),
      passwordHash: passwordHash
    });
  }

  // Create parents in DB
  const createdParents = await prisma.$transaction(
    parentData.map(p => prisma.parent.create({ data: p }))
  );
  console.log(`Created ${createdParents.length} parents.`);

  console.log("Generating Students and Enrollments...");
  
  let totalStudentsCreated = 0;
  
  for (const section of sections) {
    const studentsToCreate = 55;
    console.log(`Seeding ${studentsToCreate} students for ${section.class.grade} ${section.name}...`);
    
    for (let i = 1; i <= studentsToCreate; i++) {
      // Pick a random parent
      const parent = createdParents[Math.floor(Math.random() * createdParents.length)];
      
      const sName = generateName();
      // Ensure student has same last name as parent for realism
      const parentLastName = parent.name.split(' ').pop();
      const studentFullName = `${sName.first} ${parentLastName}`;
      
      const admissionNumber = `ADM-2026-${totalStudentsCreated + 1000}`;
      
      // Create student
      const student = await prisma.student.create({
        data: {
          admissionNumber,
          fullName: studentFullName,
          gender: Math.random() > 0.5 ? 'Male' : 'Female',
          guardianName: parent.name,
          phone: parent.phone,
          passwordHash: passwordHash
        }
      });
      
      // Link Parent and Student
      await prisma.parentStudent.create({
        data: {
          parentId: parent.id,
          studentId: student.id,
          relationship: Math.random() > 0.5 ? 'Father' : 'Mother'
        }
      });
      
      // Enroll Student
      await prisma.studentEnrollment.create({
        data: {
          studentId: student.id,
          sessionId: session.id,
          sectionId: section.id,
          campusId: campus.id,
          rollNumber: i.toString()
        }
      });
      
      totalStudentsCreated++;
    }
  }

  console.log(`Student Seeding successfully completed! Created ${totalStudentsCreated} students across ${sections.length} sections.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
