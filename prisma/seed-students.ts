import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

const firstNames = [
  'Aarav', 'Vihaan', 'Aditya', 'Diya', 'Ananya', 'Rohan', 'Ishaan', 'Kavya', 'Sanya', 'Arjun',
  'Meera', 'Riya', 'Aryan', 'Neha', 'Kabir', 'Prisha', 'Kritika', 'Vivaan', 'Pooja', 'Shruti',
  'Aanya', 'Rahul', 'Sneha', 'Tanya', 'Vikram', 'Ravi', 'Ritu', 'Priya', 'Kiran', 'Suresh',
  'Manish', 'Anita', 'Sunita', 'Raj', 'Amit', 'Anjali', 'Simran', 'Karan', 'Dev', 'Gaurav',
  'Anil', 'Ashish', 'Nisha', 'Nidhi', 'Reena', 'Vikas', 'Swati', 'Tarun', 'Yash', 'Zoya'
];

const lastNames = [
  'Sharma', 'Patel', 'Singh', 'Kumar', 'Verma', 'Gupta', 'Rao', 'Reddy', 'Chauhan', 'Nair',
  'Menon', 'Jain', 'Bose', 'Das', 'Sen', 'Kapoor', 'Chopra', 'Yadav', 'Mishra', 'Tiwari',
  'Pandey', 'Dubey', 'Saxena', 'Srivastava', 'Chakraborty', 'Banerjee', 'Iyer', 'Pillai', 'Rana',
  'Malhotra', 'Bhatia', 'Kaur', 'Sethi', 'Mehta', 'Desai', 'Garg', 'Agarwal', 'Goyal', 'Bansal'
];

function randomItem(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('Seeding Students...');

  // Fetch all sections
  const sections = await prisma.section.findMany({
    include: { class: true }
  });

  if (sections.length === 0) {
    console.error('No sections found! Please run seed-master-data.ts first.');
    return;
  }

  // Fetch active session
  const session = await prisma.academicSession.findFirst({
    where: { isActive: true }
  });

  if (!session) {
    console.error('No active session found!');
    return;
  }

  // Fetch campuses
  const campuses = await prisma.campus.findMany();
  const campus = campuses[0];
  if (!campus) {
    console.error('No campus found!');
    return;
  }

  console.log(`Found ${sections.length} sections. Will distribute 2000 students among them.`);

  const TOTAL_STUDENTS = 2000;
  const BATCH_SIZE = 250;

  const existingStudentsCount = await prisma.student.count();
  let currentAdmNumber = 1000 + existingStudentsCount;

  for (let batch = 0; batch < Math.ceil(TOTAL_STUDENTS / BATCH_SIZE); batch++) {
    console.log(`Processing batch ${batch + 1}/${Math.ceil(TOTAL_STUDENTS / BATCH_SIZE)}...`);
    const studentsData: any[] = [];
    const enrollmentsData: any[] = [];
    const docsData: any[] = [];

    for (let i = 0; i < BATCH_SIZE; i++) {
      if (batch * BATCH_SIZE + i >= TOTAL_STUDENTS) break;

      const fName = randomItem(firstNames);
      const lName = randomItem(lastNames);
      const fullName = `${fName} ${lName}`;
      const gender = Math.random() > 0.5 ? 'Male' : 'Female';
      
      const fatherFName = randomItem(firstNames);
      const motherFName = randomItem(firstNames);
      const fatherName = `${fatherFName} ${lName}`;
      const motherName = `${motherFName} ${lName}`;
      const guardianName = fatherName;
      const phone = '98' + Math.floor(10000000 + Math.random() * 90000000).toString();

      const admissionNumber = `ADM-2026-${currentAdmNumber++}`;
      
      const dob = new Date(new Date().getFullYear() - (Math.floor(Math.random() * 10) + 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      
      const studentId = crypto.randomUUID();

      // UI Avatars for pseudo-random matching faces
      const photoUrl = `https://ui-avatars.com/api/?name=${fName}+${lName}&background=random&color=fff`;

      studentsData.push({
        id: studentId,
        admissionNumber,
        fullName,
        gender,
        guardianName,
        phone,
        status: 'Active',
        documentsVerified: true,
        dateOfBirth: dob,
        photoUrl,
        details: {
          dob: dob.toISOString().split('T')[0],
          fatherName,
          motherName,
          fatherContact: phone,
          motherContact: '99' + Math.floor(10000000 + Math.random() * 90000000).toString(),
          fatherProfession: 'Engineer',
          motherProfession: 'Teacher',
          residenceAddress: '123 Fake Street, Bangalore',
          fatherPhotoUrl: `https://ui-avatars.com/api/?name=${fatherFName}+${lName}&background=random`,
          motherPhotoUrl: `https://ui-avatars.com/api/?name=${motherFName}+${lName}&background=random`
        }
      });

      // Random section
      const section = randomItem(sections);

      enrollmentsData.push({
        id: crypto.randomUUID(),
        studentId: studentId,
        sessionId: session.id,
        sectionId: section.id,
        campusId: campus.id,
        status: 'Enrolled'
      });

      // Documents
      docsData.push({
        id: crypto.randomUUID(),
        studentId: studentId,
        documentType: 'Birth Certificate',
        fileUrl: '/mock/birth-certificate.pdf',
        isVerified: true
      });
      docsData.push({
        id: crypto.randomUUID(),
        studentId: studentId,
        documentType: 'Aadhar Card',
        fileUrl: '/mock/aadhar.pdf',
        isVerified: true
      });
    }

    await prisma.$transaction([
      prisma.student.createMany({ data: studentsData }),
      prisma.studentEnrollment.createMany({ data: enrollmentsData }),
      prisma.admissionDocument.createMany({ data: docsData })
    ]);
  }

  console.log(`Successfully seeded ${TOTAL_STUDENTS} students!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
