import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();

const indianMaleNames = [
  "Aarav Sharma", "Vihaan Singh", "Aditya Patel", "Rohan Gupta", "Arjun Reddy",
  "Sai Kumar", "Dev Joshi", "Karan Malhotra", "Rahul Desai", "Aryan Verma"
];

const indianFemaleNames = [
  "Diya Sharma", "Aanya Singh", "Priya Patel", "Ananya Gupta", "Riya Reddy",
  "Kavya Kumar", "Neha Joshi", "Sneha Malhotra", "Pooja Desai", "Isha Verma"
];

const educations = [
  "B.Ed, M.Sc", "M.A. Education", "Ph.D, M.Sc", "B.Ed, B.A.",
  "M.Ed, B.Sc", "M.Phil, M.A."
];

function getRandomElement(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomExperience() {
  const years = Math.floor(Math.random() * 15) + 1;
  return `${years} Years`;
}

async function main() {
  console.log('Seeding Staff Management Center...');

  // 1. Get the "Teacher" role
  let teacherRole = await prisma.role.findFirst({ where: { name: 'Teacher' } });
  if (!teacherRole) {
    teacherRole = await prisma.role.create({
      data: {
        name: 'Teacher',
        description: 'Subject Educator',
        permissions: ['read', 'write']
      }
    });
  }

  // 2. Get active session
  const activeSession = await prisma.academicSession.findFirst({ where: { isActive: true } });
  if (!activeSession) {
    throw new Error("No active session found. Please run seed-master-data.ts first.");
  }

  // 3. Get all subjects
  const subjects = await prisma.subject.findMany();
  
  if (subjects.length === 0) {
    throw new Error("No subjects found. Please run seed-master-data.ts first.");
  }

  const passwordHash = await bcrypt.hash('Staff@123', 10);
  let maleIndex = 0;
  let femaleIndex = 0;
  
  const createdStaffIds: string[] = [];

  for (const subject of subjects) {
    // 2 or 3 teachers per subject
    const numTeachers = Math.random() > 0.5 ? 3 : 2;
    
    for (let i = 0; i < numTeachers; i++) {
      // Alternate gender
      const isMale = (i % 2 === 0);
      let fullName = "";
      
      if (isMale) {
        fullName = indianMaleNames[maleIndex % indianMaleNames.length];
        maleIndex++;
      } else {
        fullName = indianFemaleNames[femaleIndex % indianFemaleNames.length];
        femaleIndex++;
      }
      
      // Make email unique by appending subject and an index
      const email = `${fullName.split(' ')[0].toLowerCase()}.${subject.name.replace(/[^a-zA-Z]/g, '').toLowerCase()}${i}@school.com`;
      
      const newStaff = await prisma.staff.upsert({
        where: { email },
        update: {},
        create: {
          fullName,
          email,
          passwordHash,
          roleId: teacherRole.id,
          status: 'Active',
          gender: isMale ? "Male" : "Female",
          education: getRandomElement(educations),
          experience: getRandomExperience(),
          details: {
            "specialization": subject.name,
            "joiningDate": new Date().toISOString()
          }
        }
      });
      
      createdStaffIds.push(newStaff.id);
      
      // Assign the teacher to this subject for the active session (leaving sectionId null, as they are a generic subject teacher)
      await prisma.teacherAssignment.create({
        data: {
          staffId: newStaff.id,
          sessionId: activeSession.id,
          subjectId: subject.id,
          hoursPerWeek: Math.floor(Math.random() * 10) + 10,
          status: 'Active'
        }
      });
    }
  }

  console.log(`Staff Seeding complete! Added teachers for all subjects and allocated them.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
