const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Master Data Seeding...");

  // 1. Get School Profile
  let schoolProfile = await prisma.schoolProfile.findFirst();
  if (!schoolProfile) {
    console.log("No School Profile found. Creating a default one...");
    schoolProfile = await prisma.schoolProfile.create({
      data: { name: 'Default School' }
    });
  }

  // 2. Create Academic Session
  console.log("Creating Academic Session: 2026-2027");
  let session = await prisma.academicSession.findUnique({
    where: { name: '2026-2027' }
  });
  if (!session) {
    session = await prisma.academicSession.create({
      data: { name: '2026-2027', isActive: true, status: 'Active' }
    });
  }

  // 3. Create Main Campus
  console.log("Creating Campus: Main Campus");
  let campus = await prisma.campus.findUnique({
    where: { name: 'Main Campus' }
  });
  if (!campus) {
    campus = await prisma.campus.create({
      data: { 
        name: 'Main Campus', 
        address: 'Main Address', 
        capacity: 1000, 
        schoolProfileId: schoolProfile.id 
      }
    });
  }

  // 4. Create Subjects (Indian Style Core)
  const subjectNames = [
    'English', 
    'Hindi', 
    'Mathematics', 
    'Science', 
    'Social Studies', 
    'Computer Science'
  ];
  const createdSubjects = [];
  
  console.log("Creating Subjects...");
  for (const name of subjectNames) {
    let subject = await prisma.subject.findFirst({ where: { name } });
    if (!subject) {
      subject = await prisma.subject.create({
        data: { name, medium: 'English' }
      });
    }
    createdSubjects.push(subject);
  }

  // 5. Create Classes and Sections
  const grades = [
    'LKG', 'UKG', 
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 
    'Class 5', 'Class 6', 'Class 7', 'Class 8', 
    'Class 9', 'Class 10', 'Class 11', 'Class 12'
  ];

  console.log("Creating Classes, Sections, and Subject Mappings...");
  for (const grade of grades) {
    let cls = await prisma.class.findFirst({
      where: { grade, campusId: campus.id, sessionId: session.id }
    });
    
    if (!cls) {
      cls = await prisma.class.create({
        data: { 
          grade, 
          campusId: campus.id, 
          sessionId: session.id 
        }
      });
    }

    // Create Section A
    let section = await prisma.section.findFirst({
      where: { name: 'Section A', classId: cls.id }
    });
    if (!section) {
      await prisma.section.create({
        data: { name: 'Section A', classId: cls.id }
      });
    }

    // Map Subjects to Class
    for (const sub of createdSubjects) {
      const existingMapping = await prisma.classSubject.findUnique({
        where: {
          classId_subjectId: { classId: cls.id, subjectId: sub.id }
        }
      });
      
      if (!existingMapping) {
        await prisma.classSubject.create({
          data: { classId: cls.id, subjectId: sub.id }
        });
      }
    }
  }

  console.log("Master Data Seeding successfully completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
