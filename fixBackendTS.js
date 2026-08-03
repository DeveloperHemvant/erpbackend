const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getFiles(dir, filesList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, filesList);
    } else if (fullPath.endsWith('.ts')) {
      filesList.push(fullPath);
    }
  }
  return filesList;
}

const srcDir = path.join(__dirname, 'src');
const tsFiles = getFiles(srcDir);

for (const file of tsFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // 1. Campus capacity String -> Number
  content = content.replace(/capacity: (req\.body\.capacity|dto\.capacity)/g, 'capacity: Number($1)');
  
  // 2. Subject class -> classes
  content = content.replace(/include: \{ subject: \{ include: \{ class: true \} \} \}/g, 'include: { subject: { include: { classes: { include: { class: true } } } } }');
  content = content.replace(/include: \{ class: true \}/g, 'include: { classes: { include: { class: true } } }');
  content = content.replace(/include: \{ class: \{ include: \{ campus: true \} \} \}/g, 'include: { classes: { include: { class: { include: { campus: true } } } } }');
  content = content.replace(/subject\.class\.grade/g, 'subject.classes?.[0]?.class?.grade');
  content = content.replace(/subject:\s*\{\s*include:\s*\{\s*class:\s*\{\s*include:\s*\{\s*campus:\s*true\s*\}\s*\}\s*\}\s*\}/g, 'subject: { include: { classes: { include: { class: { include: { campus: true } } } } } }');
  content = content.replace(/classId: dto\.classId/g, 'classes: { create: [{ classId: dto.classId }] }');

  // 3. Decimal conversion (parseFloat(Decimal) -> toNumber())
  content = content.replace(/parseFloat\(inv\.amount\)/g, 'Number(inv.amount)');
  content = content.replace(/parseFloat\(inv\.totalAmount \|\| inv\.amount\)/g, 'Number(inv.totalAmount || inv.amount)');
  content = content.replace(/parseFloat\(invoice\.totalAmount \|\| invoice\.amount\)/g, 'Number(invoice.totalAmount || invoice.amount)');
  content = content.replace(/parseFloat\(p\.amountPaid\)/g, 'Number(p.amountPaid)');
  content = content.replace(/parseFloat\(dto\.amountPaid\)/g, 'Number(dto.amountPaid)');
  
  content = content.replace(/amount:\s*parseFloat\([^)]+\)/g, (match) => match.replace('parseFloat', 'Number'));
  
  // 4. ParentStudent enrollment -> student
  content = content.replace(/enrollmentId: enrollment\.id/g, 'studentId: student.id');
  content = content.replace(/enrollmentId: enrollment\.id/g, 'studentId: student.id');
  content = content.replace(/enrollmentId: (.*)/g, (m, p1) => m.includes('enrollmentId:') && !m.includes('attendance') && !m.includes('invoice') ? `studentId: ${p1}` : m);
  content = content.replace(/include:\s*\{\s*enrollment:\s*\{\s*include:\s*\{\s*student:\s*true\s*\}\s*\}\s*\}/g, 'include: { student: { include: { enrollments: true } } }');
  
  // 5. Parent students relation name
  content = content.replace(/parent\.students/g, 'parent.students');
  content = content.replace(/enrollment:\s*\{/g, 'student: {');

  // 6. TeacherAssignment workload -> hoursPerWeek
  content = content.replace(/workload:/g, 'hoursPerWeek:');
  content = content.replace(/dto\.workload/g, 'dto.hoursPerWeek');

  // 7. admission/students.service.ts
  content = content.replace(/student\.enrollments\[0\]\?\.parents/g, 'student.parents');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
  }
}

// Special fixes for specific files:
const importService = path.join(srcDir, 'import', 'import.service.ts');
if (fs.existsSync(importService)) {
  let content = fs.readFileSync(importService, 'utf8');
  content = content.replace(/enrollmentId: enrollment\.id,/g, 'studentId: student.id,');
  fs.writeFileSync(importService, content, 'utf8');
}

console.log('Backend TS files fixed');
