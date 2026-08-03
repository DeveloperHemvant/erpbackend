import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Generating Roll Numbers for all existing Student Enrollments...');

  // Fetch all sections with their classes
  const sections = await prisma.section.findMany({
    include: { class: true }
  });

  if (sections.length === 0) {
    console.error('No sections found! Cannot assign roll numbers.');
    return;
  }

  let totalUpdated = 0;

  for (const section of sections) {
    console.log(`Processing Section: ${section.class.grade} - ${section.name}`);
    
    // Get all enrollments in this section
    const enrollments = await prisma.studentEnrollment.findMany({
      where: { sectionId: section.id },
      orderBy: { student: { fullName: 'asc' } }, // Alphabetical order for roll numbers
      include: { student: true }
    });

    if (enrollments.length === 0) continue;

    const prefix = `${section.class.grade.replace(/\s+/g, '')}${section.name}`;
    
    const updates = enrollments.map((enrollment, index) => {
      const rollNumber = `${prefix}-${String(index + 1).padStart(3, '0')}`;
      
      return prisma.studentEnrollment.update({
        where: { id: enrollment.id },
        data: { rollNumber }
      });
    });

    // Execute updates for this section in a transaction
    await prisma.$transaction(updates);
    totalUpdated += updates.length;
    console.log(`Updated ${updates.length} roll numbers for ${section.class.grade} - ${section.name}`);
  }

  console.log(`Success! Roll numbers generated and updated for ${totalUpdated} students.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
