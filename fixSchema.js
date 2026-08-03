const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Fix 1: Campus has 'parents ParentStudent[]' and 'documents AdmissionDocument[]' which shouldn't be there.
schema = schema.replace(/parents\s+ParentStudent\[\]\n\s*documents\s+AdmissionDocument\[\]/, '');

// Fix 2: Add 'roles Role[]' to SchoolProfile
schema = schema.replace(/campuses\s+Campus\[\]/, 'campuses     Campus[]\n  roles        Role[]');

// Fix 3: Section got 'classes ClassSubject[]' instead of 'class Class'. Restore it.
schema = schema.replace(/classes\s+ClassSubject\[\]/, 'classId     String              @db.Uuid\n  class       Class               @relation(fields: [classId], references: [id], onDelete: Cascade)');

// Fix 4: Subject still has classId. Remove it and add 'classes ClassSubject[]'
schema = schema.replace(/classId\s+String\s+@db\.Uuid\n\s*class\s+Class\s+@relation\(fields: \[classId\], references: \[id\], onDelete: Cascade\)/, 'classes     ClassSubject[]');

// Fix 5: StudentEnrollment still has 'parents ParentStudent[]' because it was deleted from Campus instead of StudentEnrollment previously?
// Let's remove 'parents ParentStudent[]' from StudentEnrollment
schema = schema.replace(/parents\s+ParentStudent\[\]/, '');

// Fix 6: AssignmentSubmission got 'studentId' instead of 'enrollmentId'. Restore it.
// It currently looks like:
// studentId     String            @db.Uuid
// student       Student           @relation(fields: [studentId], references: [id], onDelete: Cascade)
// But wait, my manual fix in `schema.prisma` fixed ParentStudent to have studentId. Let's check AssignmentSubmission.
schema = schema.replace(/studentId\s+String\s+@db\.Uuid\n\s*student\s+Student\s+@relation\(fields: \[studentId\], references: \[id\], onDelete: Cascade\)\n\s*status\s+String\s+@default\("Submitted"\)/g, 'enrollmentId String            @db.Uuid\n  enrollment   StudentEnrollment @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)\n  status       String            @default("Submitted")');

// Fix 8, 11: Add 'parents ParentStudent[]' and 'documents AdmissionDocument[]' to Student
schema = schema.replace(/enrollments\s+StudentEnrollment\[\]/, 'enrollments       StudentEnrollment[]\n  parents           ParentStudent[]\n  documents         AdmissionDocument[]');

// Fix 10: Add 'rooms Room[]' to Campus
schema = schema.replace(/assets\s+Asset\[\]/, 'assets          Asset[]\n  rooms           Room[]');

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('Schema fixes applied successfully');
