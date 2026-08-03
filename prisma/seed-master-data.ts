import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Master Data...');

  // 1. School Profile
  let schoolProfile = await prisma.schoolProfile.findFirst();
  if (!schoolProfile) {
    schoolProfile = await prisma.schoolProfile.create({
      data: {
        name: 'Central Academy',
        email: 'admin@centralacademy.edu',
        phone: '1234567890'
      }
    });
  }

  // 2. Campuses
  const campusNames = ['North Campus', 'South Campus', 'East Campus'];
  const campuses: any[] = [];
  for (const cName of campusNames) {
    const c = await prisma.campus.upsert({
      where: { name: cName },
      update: {},
      create: {
        schoolProfileId: schoolProfile.id,
        name: cName,
        address: `${cName} Address`,
        capacity: 1500,
        latitude: 12.0,
        longitude: 77.0,
        status: 'Active'
      }
    });
    campuses.push(c);
  }

  // 3. Sessions
  const sessionNames = ['2026-2027', '2027-2028'];
  const sessions: any[] = [];
  for (const sName of sessionNames) {
    const s = await prisma.academicSession.upsert({
      where: { name: sName },
      update: {},
      create: {
        name: sName,
        isActive: sName === '2026-2027',
        status: 'Active'
      }
    });
    sessions.push(s);
  }

  // 4. Subjects
  const allSubjects = [
    { name: 'Mathematics', medium: 'English', target: 'ALL' },
    { name: 'Science', medium: 'English', target: 'LKG-10' },
    { name: 'English', medium: 'English', target: 'ALL' },
    { name: 'Hindi', medium: 'Hindi', target: 'LKG-10' },
    { name: 'Social Studies', medium: 'English', target: 'LKG-10' },
    { name: 'Physics', medium: 'English', target: '11-12' },
    { name: 'Chemistry', medium: 'English', target: '11-12' },
    { name: 'Biology', medium: 'English', target: '11-12' },
    { name: 'Computer Science', medium: 'English', target: '11-12' },
  ];

  const createdSubjects: any[] = [];
  for (const subj of allSubjects) {
    let s = await prisma.subject.findFirst({ where: { name: subj.name, medium: subj.medium } });
    if (!s) {
      s = await prisma.subject.create({
        data: {
          name: subj.name,
          medium: subj.medium,
        }
      });
    }
    createdSubjects.push({ ...s, target: subj.target });
  }

  // 5. Classes, Sections & ClassSubjects
  const grades = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const sectionNames = ['A', 'B', 'C', 'D'];

  for (const campus of campuses) {
    for (const session of sessions) {
      for (const grade of grades) {
        
        let existingClass = await prisma.class.findFirst({
          where: { grade, campusId: campus.id, sessionId: session.id }
        });

        if (!existingClass) {
          // Randomly pick 2 to 4 sections
          const numSections = Math.floor(Math.random() * 3) + 2; 
          const selectedSections = sectionNames.slice(0, numSections);

          const newClass = await prisma.class.create({
            data: {
              grade: grade,
              campusId: campus.id,
              sessionId: session.id,
              sections: {
                create: selectedSections.map(s => ({ name: s }))
              }
            }
          });

          // Filter subjects based on grade
          let validSubjects: any[] = [];
          if (['11', '12'].includes(grade)) {
             validSubjects = createdSubjects.filter(s => s.target === 'ALL' || s.target === '11-12');
          } else {
             validSubjects = createdSubjects.filter(s => s.target === 'ALL' || s.target === 'LKG-10');
          }

          // Link ClassSubjects
          for (const subj of validSubjects) {
            await prisma.classSubject.create({
              data: {
                classId: newClass.id,
                subjectId: subj.id
              }
            });
          }
        }
      }
    }
  }

  // 6. Assign Class Teachers (TeacherAssignment with subjectId = null)
  console.log('Assigning Class Teachers...');
  const teachers = await prisma.staff.findMany({
    where: { role: { name: { contains: 'Teacher', mode: 'insensitive' } } }
  });

  if (teachers.length > 0) {
    const sections = await prisma.section.findMany();
    const activeSession = sessions.find(s => s.isActive) || sessions[0];
    
    // Assign one random teacher per section as class teacher
    for (const section of sections) {
      const existingAssignment = await prisma.teacherAssignment.findFirst({
        where: { sectionId: section.id, subjectId: null, sessionId: activeSession.id }
      });
      
      if (!existingAssignment) {
        const randomTeacher = teachers[Math.floor(Math.random() * teachers.length)];
        await prisma.teacherAssignment.create({
          data: {
            staffId: randomTeacher.id,
            sessionId: activeSession.id,
            sectionId: section.id,
            // subjectId remains null to indicate class teacher
            status: 'Active'
          }
        });
      }
    }
  } else {
    console.log('No teachers found in DB. Skip class teacher assignment.');
  }

  console.log('Master Data Seeding complete! Added all campuses, sessions, classes (LKG to 12th), random sections, mapped subjects, and assigned class teachers.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
