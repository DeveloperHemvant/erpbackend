const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// 1. Campus capacity
schema = schema.replace(/capacity\s+String/, 'capacity        Int');

// 2. Role schoolProfileId
schema = schema.replace(
  /staff\s+Staff\[\]/,
  'staff       Staff[]\n  schoolProfileId String?  @db.Uuid\n  schoolProfile SchoolProfile? @relation(fields: [schoolProfileId], references: [id], onDelete: Cascade)'
);

// 3. Student fields
schema = schema.replace(
  /documentsVerified Boolean\s+@default\(false\)/,
  'documentsVerified Boolean             @default(false)\n  dateOfBirth       DateTime?\n  photoUrl          String?\n  faceEmbedding     Json?               @db.JsonB\n  passwordHash      String?'
);
schema = schema.replace(
  /enrollments\s+StudentEnrollment\[\]/,
  'enrollments       StudentEnrollment[]\n  parents           ParentStudent[]\n  documents         AdmissionDocument[]'
);

// 4. Class subjects
schema = schema.replace(/subjects\s+Subject\[\]/, 'subjects      ClassSubject[]');

// 5. Subject
schema = schema.replace(/classId\s+String\s+@db\.Uuid\n\s+class\s+Class\s+@relation\(fields: \[classId\], references: \[id\], onDelete: Cascade\)/, 'classes     ClassSubject[]');

// 6. StudentEnrollment parents
schema = schema.replace(/parents\s+ParentStudent\[\]\n/, '');

// 7. TeacherAssignment
schema = schema.replace(/workload\s+String\?\s*\/\/\s*e\.g\.\s*"14 hrs\/week"/, 'hoursPerWeek Float?');
schema = schema.replace(/section\s+Section\?\s+@relation\(fields: \[sectionId\], references: \[id\], onDelete: SetNull\)/, 'section   Section?          @relation(fields: [sectionId], references: [id], onDelete: SetNull)\n  roomId    String?           @db.Uuid\n  room      Room?             @relation(fields: [roomId], references: [id], onDelete: SetNull)');

// 8. ParentStudent
schema = schema.replace(/enrollmentId\s+String\s+@db\.Uuid/, 'studentId     String            @db.Uuid');
schema = schema.replace(/enrollment\s+StudentEnrollment\s+@relation\(fields: \[enrollmentId\], references: \[id\], onDelete: Cascade\)/, 'student       Student           @relation(fields: [studentId], references: [id], onDelete: Cascade)');
schema = schema.replace(/@@unique\(\[parentId, enrollmentId\]\)/, '@@unique([parentId, studentId])');

// 9. Parent password
schema = schema.replace(/email\s+String\?\s+@unique/, 'email       String?  @unique\n  passwordHash String?');

// 10. FeeStructure
schema = schema.replace(/amount\s+String\s*\/\/\s*Base amount/, 'amount    Decimal         // Base amount');

// 11. FeeInvoice
schema = schema.replace(/amount\s+String\n\s+lateFeeAmount\s+String\?\s+@default\("0"\)\n\s+totalAmount\s+String\?/, 'amount       Decimal\n  lateFeeAmount Decimal?         @default(0)\n  totalAmount  Decimal?');

// 12. FeePayment
schema = schema.replace(/amountPaid\s+String/, 'amountPaid      Decimal');
schema = schema.replace(/paymentDate\s+String\s*\/\/\s*YYYY-MM-DD/, 'paymentDate     String // YYYY-MM-DD\n  transactionRef  String?\n  gatewayPaymentId String?');

// Append new models at the end
const newModels = `
model ClassSubject {
  classId   String  @db.Uuid
  class     Class   @relation(fields: [classId], references: [id], onDelete: Cascade)
  subjectId String  @db.Uuid
  subject   Subject @relation(fields: [subjectId], references: [id], onDelete: Cascade)

  @@id([classId, subjectId])
  @@map("class_subjects")
}

model Room {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  capacity  Int
  campusId  String   @db.Uuid
  campus    Campus   @relation(fields: [campusId], references: [id], onDelete: Cascade)
  status    String   @default("Active")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  assignments TeacherAssignment[]

  @@map("rooms")
}

model AdmissionDocument {
  id           String   @id @default(uuid()) @db.Uuid
  studentId    String   @db.Uuid
  student      Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  documentType String   // e.g. "Birth Certificate", "Transfer Certificate"
  fileUrl      String
  isVerified   Boolean  @default(false)
  uploadedAt   DateTime @default(now())
  
  @@map("admission_documents")
}
`;

schema += newModels;

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('Schema updated successfully');
