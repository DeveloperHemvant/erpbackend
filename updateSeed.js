const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, 'prisma', 'seed.ts');
let seed = fs.readFileSync(seedPath, 'utf8');

// 1. FeeStructure creation
// Before "const math = await prisma.subject.create", insert FeeStructure creation
seed = seed.replace(
  /const math = await prisma\.subject\.create/,
  `const feeStructure = await prisma.feeStructure.create({
    data: {
      name: 'Grade 10 Tuition',
      amount: 15000,
      cycle: 'Annual',
      sessionId: session.id,
      classId: class10.id
    }
  });

  const math = await prisma.subject.create`
);

// 2. ClassSubject linking
seed = seed.replace(
  /classId: class10\.id,/g,
  `classes: {
        create: [{ classId: class10.id }]
      },`
);

// 3. TeacherAssignment hoursPerWeek
seed = seed.replace(
  /workload:\s*'14 hrs\/week'/g,
  'hoursPerWeek: 14.0'
);

// 4. Parent deduplication and ParentStudent studentId
// Original code:
// const parent = await prisma.parent.create({
//   data: {
//     name: \`Parent of \${i}\`,
//     email: \`parent\${i}@test.com\`,
//     phone: \`555-030\${i}\`
//   }
// });
// await prisma.parentStudent.create({
//   data: {
//     parentId: parent.id,
//     enrollmentId: enrollment.id,
//     relationship: 'Father'
//   }
// });

// We want parents to be shared for some students to simulate siblings. 
// E.g., email: \`parent\${Math.ceil(i/2)}@test.com\`
seed = seed.replace(
  /const parent = await prisma\.parent\.create\(\{\n\s*data: \{\n\s*name: `Parent of \$\{i\}`,\n\s*email: `parent\$\{i\}@test\.com`,\n\s*phone: `555-030\$\{i\}`\n\s*\}\n\s*\}\);/g,
  `const parentEmail = \`parent\${Math.ceil(i/2)}@test.com\`;
    const parent = await prisma.parent.upsert({
      where: { email: parentEmail },
      update: {},
      create: {
        name: \`Parent Family \${Math.ceil(i/2)}\`,
        email: parentEmail,
        phone: \`555-030\${Math.ceil(i/2)}\`
      }
    });`
);

seed = seed.replace(
  /enrollmentId:\s*enrollment\.id,/g,
  'studentId: student.id,'
);

// Except in FeeInvoice and other transaction tables!
// Wait, replacing enrollmentId with studentId globally is bad because FeeInvoice needs enrollmentId!
// Let's revert that global replace and only replace it in the ParentStudent block.

// 5. FeeInvoice amounts and structureId
// Original:
// amount: '15000',
// totalAmount: '15000',
// dueDate: '2026-08-01',
seed = seed.replace(
  /amount:\s*'15000',/g,
  'amount: 15000,\n        structureId: feeStructure.id,'
);
seed = seed.replace(
  /totalAmount:\s*'15000',/g,
  'totalAmount: 15000,'
);

// Fix the ParentStudent enrollmentId issue by string replacement.
// The code block is:
//     await prisma.parentStudent.create({
//       data: {
//         parentId: parent.id,
//         studentId: student.id,
//         relationship: 'Father'
//       }
//     });
// Wait, since I replaced globally, I need to fix ParentStudent explicitly.
seed = seed.replace(
  /parentId: parent\.id,\n\s*studentId: student\.id,/g,
  'parentId: parent.id,\n        studentId: student.id,'
);
// But wait, the original `enrollmentId: enrollment.id,` in ParentStudent was replaced globally. 
// I should ONLY replace it inside ParentStudent.
seed = fs.readFileSync(seedPath, 'utf8');

// REDO PROPERLY
// 1. FeeStructure creation
seed = seed.replace(
  /const math = await prisma\.subject\.create/,
  `const feeStructure = await prisma.feeStructure.create({
    data: {
      name: 'Grade 10 Tuition',
      amount: 15000,
      cycle: 'Annual',
      sessionId: session.id,
      classId: class10.id
    }
  });

  const math = await prisma.subject.create`
);

// 2. ClassSubject linking
seed = seed.replace(
  /classId: class10\.id,/g,
  `classes: {
        create: [{ classId: class10.id }]
      },`
);

// 3. TeacherAssignment hoursPerWeek
seed = seed.replace(
  /workload:\s*'14 hrs\/week'/g,
  'hoursPerWeek: 14.0'
);

// 4. Parent deduplication
seed = seed.replace(
  /const parent = await prisma\.parent\.create\(\{\n\s*data: \{\n\s*name: `Parent of \$\{i\}`,\n\s*email: `parent\$\{i\}@test\.com`,\n\s*phone: `555-030\$\{i\}`\n\s*\}\n\s*\}\);/g,
  `const parentEmail = \`parent\${Math.ceil(i/2)}@test.com\`;
    const parent = await prisma.parent.upsert({
      where: { email: parentEmail },
      update: {},
      create: {
        name: \`Parent Family \${Math.ceil(i/2)}\`,
        email: parentEmail,
        phone: \`555-030\${Math.ceil(i/2)}\`
      }
    });`
);

// 5. ParentStudent studentId (specific replace)
seed = seed.replace(
  /await prisma\.parentStudent\.create\(\{\n\s*data: \{\n\s*parentId: parent\.id,\n\s*enrollmentId: enrollment\.id,\n\s*relationship: 'Father'\n\s*\}\n\s*\}\);/g,
  `await prisma.parentStudent.create({
      data: {
        parentId: parent.id,
        studentId: student.id,
        relationship: 'Father'
      }
    });`
);

// 6. FeeInvoice amounts and structureId
seed = seed.replace(
  /amount:\s*'15000',/g,
  'amount: 15000,\n        structureId: feeStructure.id,'
);
seed = seed.replace(
  /totalAmount:\s*'15000',/g,
  'totalAmount: 15000,'
);

// 7. FeePayment amountPaid
seed = seed.replace(
  /amountPaid:\s*'15000',/g,
  'amountPaid: 15000,'
);

fs.writeFileSync(seedPath, 'import * as bcrypt from "bcrypt";\n' + seed.replace('import * as bcrypt from "bcrypt";\n', ''), 'utf8');
console.log('Seed updated successfully');
