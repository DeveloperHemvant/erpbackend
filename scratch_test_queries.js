const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const parent = await prisma.parent.findUnique({
      where: { id: 'c581fd53-6286-4984-a62b-422b3fb9ffb3' },
      include: {
        students: {
          include: {
            student: {
              include: {
                enrollments: {
                  include: { invoices: true }
                }
              }
            }
          }
        }
      }
    });
    console.log("Parent query ok");
    
    if (parent.students.length > 0) {
      const studentId = parent.students[0].student.id;
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          enrollments: {
            include: {
              section: { include: { classes: { include: { class: true } } } },
              attendance: true,
              examMarks: { include: { examSlot: { include: { exam: true, subject: true } } } },
              reportCards: { include: { exam: true } }
            }
          }
        }
      });
      console.log("Student query ok");
    }
  } catch (e) {
    console.error(e.message);
  }
}

main().finally(() => prisma.$disconnect());
