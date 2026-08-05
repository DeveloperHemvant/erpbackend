-- CreateTable
CREATE TABLE "school_profile" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "contactInfo" TEXT,
    "address" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "school_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campuses" (
    "id" UUID NOT NULL,
    "schoolProfileId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "campuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "schoolProfileId" UUID,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "roleId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "gender" TEXT,
    "education" TEXT,
    "experience" TEXT,
    "photoUrl" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL,
    "admissionNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "guardianName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "documentsVerified" BOOLEAN NOT NULL DEFAULT false,
    "dateOfBirth" TIMESTAMP(3),
    "photoUrl" TEXT,
    "profilePicture" TEXT,
    "faceEmbedding" JSONB,
    "passwordHash" TEXT,
    "documentDetails" JSONB,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_sessions" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "academic_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" UUID NOT NULL,
    "grade" TEXT NOT NULL,
    "campusId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "classId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "medium" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_enrollments" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "sectionId" UUID NOT NULL,
    "rollNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Enrolled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "campusId" UUID,

    CONSTRAINT "student_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_assignments" (
    "id" UUID NOT NULL,
    "staffId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "subjectId" UUID,
    "sectionId" UUID,
    "roomId" UUID,
    "isClassTeacher" BOOLEAN NOT NULL DEFAULT false,
    "hoursPerWeek" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "teacher_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" UUID NOT NULL,
    "enrollmentId" UUID,
    "staffId" UUID,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "checkInTime" TEXT,
    "checkOutTime" TEXT,
    "faceVerified" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "campusId" UUID,
    "sessionId" UUID,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_cards" (
    "id" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "examId" UUID,
    "attendanceRate" TEXT NOT NULL,
    "gpa" TEXT NOT NULL,
    "computedData" JSONB,
    "remarks" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "report_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exams" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "term" TEXT,
    "sessionId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_slots" (
    "id" UUID NOT NULL,
    "examId" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "exam_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_marks" (
    "id" UUID NOT NULL,
    "examSlotId" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "marksObtained" DOUBLE PRECISION,
    "isAbsent" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "exam_marks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grading_rules" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "rules" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "grading_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parents" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "passwordHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_students" (
    "id" UUID NOT NULL,
    "parentId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'Parent',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_accounts" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "referenceId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portal_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "readStatus" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL DEFAULT 'ALL',
    "eventDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "parentId" UUID NOT NULL,
    "staffId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "senderType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "readStatus" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetables" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sessionId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timetables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetable_slots" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isBreak" BOOLEAN NOT NULL DEFAULT false,
    "sessionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "timetable_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetable_periods" (
    "id" UUID NOT NULL,
    "timetableId" UUID NOT NULL,
    "sectionId" UUID NOT NULL,
    "subjectId" UUID,
    "assignmentId" UUID NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "timetable_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostels" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "warden" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',

    CONSTRAINT "hostels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_rooms" (
    "id" UUID NOT NULL,
    "hostelId" UUID NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',

    CONSTRAINT "hostel_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_allocations" (
    "id" UUID NOT NULL,
    "roomId" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hostel_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_attendance" (
    "id" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hostel_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_grievances" (
    "id" UUID NOT NULL,
    "hostelId" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hostel_grievances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mess_menus" (
    "id" UUID NOT NULL,
    "hostelId" UUID NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mess_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_books" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "isbn" TEXT,
    "category" TEXT,
    "totalCopies" INTEGER NOT NULL DEFAULT 1,
    "available" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "library_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_issues" (
    "id" UUID NOT NULL,
    "bookId" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Issued',

    CONSTRAINT "book_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_fines" (
    "id" UUID NOT NULL,
    "issueId" UUID NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Unpaid',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "library_fines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_reservations" (
    "id" UUID NOT NULL,
    "bookId" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Reserved',
    "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "fulfilledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "library_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',

    CONSTRAINT "asset_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "campusId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_requisitions" (
    "id" UUID NOT NULL,
    "campusId" UUID NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "estimatedCost" DOUBLE PRECISION,
    "purpose" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "purchase_requisitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_balances" (
    "id" UUID NOT NULL,
    "staffId" UUID NOT NULL,
    "leaveType" TEXT NOT NULL,
    "totalAllowed" DOUBLE PRECISION NOT NULL,
    "used" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_applications" (
    "id" UUID NOT NULL,
    "staffId" UUID NOT NULL,
    "leaveType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" UUID,

    CONSTRAINT "leave_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_leave_applications" (
    "id" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "leaveType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" UUID,

    CONSTRAINT "student_leave_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_structures" (
    "id" UUID NOT NULL,
    "staffId" UUID NOT NULL,
    "basicSalary" DOUBLE PRECISION NOT NULL,
    "allowances" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslips" (
    "id" UUID NOT NULL,
    "staffId" UUID NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "basicSalary" DOUBLE PRECISION NOT NULL,
    "allowances" DOUBLE PRECISION NOT NULL,
    "fixedDeductions" DOUBLE PRECISION NOT NULL,
    "lopDeductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netSalary" DOUBLE PRECISION NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Generated',

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_reviews" (
    "id" UUID NOT NULL,
    "staffId" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "cycle" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_structures" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "cycle" TEXT NOT NULL,
    "sessionId" UUID NOT NULL,
    "classId" UUID,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_invoices" (
    "id" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "structureId" UUID,
    "amount" DECIMAL(65,30) NOT NULL,
    "lateFeeAmount" DECIMAL(65,30) DEFAULT 0,
    "totalAmount" DECIMAL(65,30),
    "dueDate" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "campusId" UUID,

    CONSTRAINT "fee_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_payments" (
    "id" UUID NOT NULL,
    "invoiceId" UUID NOT NULL,
    "amountPaid" DECIMAL(65,30) NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "referenceNo" TEXT,
    "paymentDate" TEXT NOT NULL,
    "transactionRef" TEXT,
    "gatewayPaymentId" TEXT,
    "gatewayResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "fee_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_refunds" (
    "id" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Requested',
    "refundMode" TEXT,
    "referenceNo" TEXT,
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "remarks" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "fee_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "userEmail" TEXT,
    "action" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_subjects" (
    "classId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,

    CONSTRAINT "class_subjects_pkey" PRIMARY KEY ("classId","subjectId")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "campusId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_documents" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admission_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_templates" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "designJson" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_vehicles" (
    "id" UUID NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "internalBusCode" TEXT,
    "busName" TEXT,
    "vehicleType" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "manufacturingYear" INTEGER,
    "purchaseDate" TEXT,
    "registrationNumber" TEXT,
    "engineNumber" TEXT,
    "chassisNumber" TEXT,
    "vin" TEXT,
    "profilePicture" TEXT,
    "seatingCapacity" INTEGER NOT NULL,
    "standingCapacity" INTEGER,
    "currentOdometer" DOUBLE PRECISION,
    "color" TEXT,
    "fuelType" TEXT,
    "transmission" TEXT,
    "insuranceCompany" TEXT,
    "insurancePolicyNumber" TEXT,
    "insuranceExpiry" TEXT,
    "roadTaxExpiry" TEXT,
    "fitnessCertificate" TEXT,
    "permitNumber" TEXT,
    "permitExpiry" TEXT,
    "pollutionCertificate" TEXT,
    "fireExtinguisherExpiry" TEXT,
    "gpsDevice" BOOLEAN NOT NULL DEFAULT false,
    "rfidDevice" BOOLEAN NOT NULL DEFAULT false,
    "cameraInstalled" BOOLEAN NOT NULL DEFAULT false,
    "panicButton" BOOLEAN NOT NULL DEFAULT false,
    "firstAidKit" BOOLEAN NOT NULL DEFAULT false,
    "speedGovernorInstalled" BOOLEAN NOT NULL DEFAULT false,
    "wheelchairAccessible" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "id_card_templates" (
    "id" UUID NOT NULL,
    "templateName" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL DEFAULT 'Aetheria Academy',
    "logoUrl" TEXT,
    "signatureUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#3b82f6',
    "secondaryColor" TEXT NOT NULL DEFAULT '#1e40af',
    "backgroundUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "id_card_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "id_cards" (
    "id" UUID NOT NULL,
    "idNumber" TEXT NOT NULL,
    "templateId" UUID NOT NULL,
    "studentId" UUID,
    "staffId" UUID,
    "barcodeData" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "id_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_vehicle_documents" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "issueDate" TEXT,
    "expiryDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Valid',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_vehicle_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_vehicle_staff" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "staffId" UUID NOT NULL,
    "shift" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Assigned',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_vehicle_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_routes" (
    "id" UUID NOT NULL,
    "routeName" TEXT NOT NULL,
    "distance" DOUBLE PRECISION,
    "estimatedTime" TEXT,
    "morningStartTime" TEXT,
    "afternoonStartTime" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "vehicleId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_route_stops" (
    "id" UUID NOT NULL,
    "routeId" UUID NOT NULL,
    "stopName" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "arrivalTime" TEXT,
    "departureTime" TEXT,
    "distanceFromPrev" DOUBLE PRECISION,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_route_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_student_assignments" (
    "id" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "routeId" UUID,
    "stopId" UUID,
    "morningPickup" BOOLEAN NOT NULL DEFAULT true,
    "afternoonDrop" BOOLEAN NOT NULL DEFAULT true,
    "seatNumber" TEXT,
    "feePeriod" TEXT,
    "guardianAuth" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_student_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_trips" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "routeId" UUID NOT NULL,
    "tripType" TEXT NOT NULL,
    "driverId" UUID,
    "date" TEXT NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "startOdometer" DOUBLE PRECISION,
    "endOdometer" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_trip_logs" (
    "id" UUID NOT NULL,
    "tripId" UUID NOT NULL,
    "stopId" UUID,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "speed" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "transport_trip_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_attendance" (
    "id" UUID NOT NULL,
    "tripId" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "markedBy" TEXT NOT NULL,
    "stopId" UUID,

    CONSTRAINT "transport_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_fuel_logs" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "date" TEXT NOT NULL,
    "fuelStation" TEXT,
    "invoiceNumber" TEXT,
    "fuelType" TEXT NOT NULL,
    "litres" DOUBLE PRECISION NOT NULL,
    "ratePerLitre" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "currentOdometer" DOUBLE PRECISION NOT NULL,
    "previousOdometer" DOUBLE PRECISION,
    "mileage" DOUBLE PRECISION,
    "filledBy" TEXT,
    "receiptUrl" TEXT,
    "remarks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_fuel_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_odometer_logs" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "date" TEXT NOT NULL,
    "openingReading" DOUBLE PRECISION NOT NULL,
    "closingReading" DOUBLE PRECISION,
    "distanceTravelled" DOUBLE PRECISION,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_odometer_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_daily_checks" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "driverId" UUID,
    "tripId" UUID,
    "date" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "brakesOk" BOOLEAN NOT NULL DEFAULT true,
    "tyresOk" BOOLEAN NOT NULL DEFAULT true,
    "lightsIndicatorsOk" BOOLEAN NOT NULL DEFAULT true,
    "hornOk" BOOLEAN NOT NULL DEFAULT true,
    "firstAidKitOk" BOOLEAN NOT NULL DEFAULT true,
    "fireExtinguisherOk" BOOLEAN NOT NULL DEFAULT true,
    "fuelLevelOk" BOOLEAN NOT NULL DEFAULT true,
    "odometerReading" DOUBLE PRECISION,
    "overallStatus" TEXT NOT NULL DEFAULT 'Fit',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_daily_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_vendors" (
    "id" UUID NOT NULL,
    "vendorName" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "vendorType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_inventory" (
    "id" UUID NOT NULL,
    "itemName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "partNumber" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "vendorId" UUID,
    "minimumStock" INTEGER NOT NULL DEFAULT 5,
    "lastRestockedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Available',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_services" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "serviceDate" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "odometerReading" DOUBLE PRECISION NOT NULL,
    "vendorId" UUID,
    "mechanicName" TEXT,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "description" TEXT,
    "invoiceUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Completed',
    "nextServiceDate" TEXT,
    "nextServiceOdo" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_tyres" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "tyreNumber" TEXT NOT NULL,
    "brand" TEXT,
    "type" TEXT NOT NULL,
    "installedDate" TEXT NOT NULL,
    "installedOdo" DOUBLE PRECISION NOT NULL,
    "currentOdo" DOUBLE PRECISION,
    "treadDepth" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'In Use',
    "warrantyExpiry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_tyres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_batteries" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "batteryNumber" TEXT NOT NULL,
    "brand" TEXT,
    "capacity" TEXT,
    "installedDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'In Use',
    "warrantyExpiry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_batteries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_breakdowns" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "driverId" UUID,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT NOT NULL,
    "actionTaken" TEXT,
    "towingRequired" BOOLEAN NOT NULL DEFAULT false,
    "costIncurred" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Reported',
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_breakdowns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_accidents" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "driverId" UUID,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "policeReport" BOOLEAN NOT NULL DEFAULT false,
    "firNumber" TEXT,
    "insuranceClaimed" BOOLEAN NOT NULL DEFAULT false,
    "claimAmount" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'Under Investigation',
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_accidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_expenses" (
    "id" UUID NOT NULL,
    "vehicleId" UUID,
    "date" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "vendorId" UUID,
    "remarks" TEXT,
    "receiptUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_courses" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subjectId" UUID,
    "classId" UUID,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "lms_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_course_sections" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "sectionId" UUID,
    "teacherId" UUID,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_course_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_curriculum" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "board" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_curriculum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_units" (
    "id" UUID NOT NULL,
    "curriculumId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_chapters" (
    "id" UUID NOT NULL,
    "unitId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "learningOutcomes" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_topics" (
    "id" UUID NOT NULL,
    "chapterId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_lessons" (
    "id" UUID NOT NULL,
    "topicId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "durationMin" INTEGER NOT NULL DEFAULT 30,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lms_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_content_resources" (
    "id" UUID NOT NULL,
    "lessonId" UUID,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "uploadedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_content_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_assignments" (
    "id" UUID NOT NULL,
    "lessonId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_submissions" (
    "id" UUID NOT NULL,
    "assignmentId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "content" TEXT,
    "fileUrl" TEXT,
    "score" DOUBLE PRECISION,
    "feedback" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gradedAt" TIMESTAMP(3),

    CONSTRAINT "lms_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_rubrics" (
    "id" UUID NOT NULL,
    "assignmentId" UUID NOT NULL,
    "criteria" TEXT NOT NULL,
    "maxPoints" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_rubrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_question_banks" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subjectId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_question_banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_questions" (
    "id" UUID NOT NULL,
    "questionBankId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "options" JSONB,
    "explanation" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_quizzes" (
    "id" UUID NOT NULL,
    "lessonId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationMin" INTEGER,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_quiz_attempts" (
    "id" UUID NOT NULL,
    "quizId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "score" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "responses" JSONB,

    CONSTRAINT "lms_quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_gradebooks" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_gradebooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_grades" (
    "id" UUID NOT NULL,
    "gradebookId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "totalScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "letterGrade" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lms_grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_live_classes" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "meetingUrl" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 60,
    "hostId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_live_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_discussion_threads" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "authorId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_discussion_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_discussion_posts" (
    "id" UUID NOT NULL,
    "threadId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_discussion_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_student_portfolios" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "totalXP" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_student_portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_badges" (
    "id" UUID NOT NULL,
    "portfolioId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "iconUrl" TEXT,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_certificates" (
    "id" UUID NOT NULL,
    "portfolioId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileUrl" TEXT,

    CONSTRAINT "lms_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_ai_generations" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "prompt" TEXT NOT NULL,
    "result" TEXT,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_ai_generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ems_exam_sessions" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ems_exam_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ems_exam_types" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ems_exam_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ems_exam_templates" (
    "id" UUID NOT NULL,
    "typeId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "totalMarks" DOUBLE PRECISION NOT NULL,
    "passMarks" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ems_exam_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ems_exam_schedules" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mode" TEXT NOT NULL DEFAULT 'OFFLINE',
    "durationMin" INTEGER,
    "questionPaperId" UUID,

    CONSTRAINT "ems_exam_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ems_exam_rooms" (
    "id" UUID NOT NULL,
    "scheduleId" UUID NOT NULL,
    "roomId" UUID NOT NULL,
    "capacity" INTEGER NOT NULL,

    CONSTRAINT "ems_exam_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ems_exam_seatings" (
    "id" UUID NOT NULL,
    "roomId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "seatNumber" TEXT NOT NULL,

    CONSTRAINT "ems_exam_seatings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ems_invigilators" (
    "id" UUID NOT NULL,
    "roomId" UUID NOT NULL,
    "staffId" UUID NOT NULL,

    CONSTRAINT "ems_invigilators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ems_question_banks" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "subjectId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ems_question_banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ems_questions" (
    "id" UUID NOT NULL,
    "questionBankId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "bloomLevel" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "options" JSONB,
    "correctOptionId" TEXT,
    "marks" DOUBLE PRECISION NOT NULL DEFAULT 1,

    CONSTRAINT "ems_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ems_question_papers" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "subjectId" UUID NOT NULL,
    "totalMarks" DOUBLE PRECISION NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ems_question_papers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ems_question_paper_items" (
    "id" UUID NOT NULL,
    "questionPaperId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "marks" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ems_question_paper_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ems_exam_attempts" (
    "id" UUID NOT NULL,
    "scheduleId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ems_exam_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ems_online_submissions" (
    "id" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "scheduleId" UUID NOT NULL,
    "startedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "autoSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ems_online_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ems_answers" (
    "id" UUID NOT NULL,
    "submissionId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "selectedOptionId" TEXT,
    "textAnswer" TEXT,
    "isCorrect" BOOLEAN,
    "marksAwarded" DOUBLE PRECISION,
    "answeredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ems_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ems_answer_sheets" (
    "id" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "fileUrl" TEXT,
    "content" TEXT,
    "isGraded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ems_answer_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ems_evaluation_records" (
    "id" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "evaluatorId" UUID NOT NULL,
    "marksObtained" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "gradedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ems_evaluation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ems_moderation_records" (
    "id" UUID NOT NULL,
    "scheduleId" UUID NOT NULL,
    "moderatorId" UUID NOT NULL,
    "graceMarks" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ems_moderation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ems_grading_schemes" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ranges" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ems_grading_schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ems_gradebooks" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ems_gradebooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ems_results" (
    "id" UUID NOT NULL,
    "gradebookId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "totalMarks" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "grade" TEXT,
    "gpa" DOUBLE PRECISION,
    "rank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ems_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ems_report_cards" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "fileUrl" TEXT,
    "remarks" TEXT,
    "attendance" DOUBLE PRECISION,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ems_report_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ems_certificates" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ems_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acms_academic_terms" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acms_academic_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acms_holiday_master" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "campusId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acms_holiday_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acms_working_days" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isWorkingDay" BOOLEAN NOT NULL DEFAULT true,
    "isHalfDay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acms_working_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acms_events" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "organizer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acms_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acms_resource_bookings" (
    "id" UUID NOT NULL,
    "resourceName" TEXT NOT NULL,
    "bookedBy" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acms_resource_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acms_notifications" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNREAD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acms_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acms_audit_logs" (
    "id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "details" TEXT,

    CONSTRAINT "acms_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_audit_logs" (
    "id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "performedBy" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "deviceInfo" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "userType" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_profiles" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "bloodGroup" TEXT,
    "allergies" TEXT,
    "chronicConditions" TEXT,
    "currentMedications" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "familyDoctorName" TEXT,
    "familyDoctorPhone" TEXT,
    "insuranceProvider" TEXT,
    "insurancePolicyNo" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_visits" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "healthProfileId" UUID,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "symptoms" TEXT,
    "temperature" DOUBLE PRECISION,
    "treatmentGiven" TEXT,
    "actionTaken" TEXT NOT NULL DEFAULT 'Observed and Released',
    "parentNotified" BOOLEAN NOT NULL DEFAULT false,
    "loggedByStaffId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaccinations" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "healthProfileId" UUID,
    "vaccineName" TEXT NOT NULL,
    "doseNumber" INTEGER NOT NULL DEFAULT 1,
    "dateAdministered" TIMESTAMP(3) NOT NULL,
    "nextDueDate" TIMESTAMP(3),
    "administeredBy" TEXT,
    "certificateUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vaccinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discipline_incidents" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'Minor',
    "description" TEXT NOT NULL,
    "actionTaken" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "reportedByStaffId" UUID NOT NULL,
    "parentNotified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discipline_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discipline_counseling_notes" (
    "id" UUID NOT NULL,
    "incidentId" UUID NOT NULL,
    "note" TEXT NOT NULL,
    "createdByStaffId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discipline_counseling_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_inquiries" (
    "id" UUID NOT NULL,
    "childName" TEXT NOT NULL,
    "gradeInterested" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "source" TEXT NOT NULL DEFAULT 'Walk-in',
    "status" TEXT NOT NULL DEFAULT 'New',
    "notes" TEXT,
    "assignedToStaffId" UUID,
    "convertedStudentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_inquiry_followups" (
    "id" UUID NOT NULL,
    "inquiryId" UUID NOT NULL,
    "note" TEXT NOT NULL,
    "followUpDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByStaffId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admission_inquiry_followups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "fileName" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "uploadedById" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_definitions" (
    "id" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stages" JSONB NOT NULL,
    "transitions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rules" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "definition" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor_records" (
    "id" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "hostId" UUID,
    "govIdType" TEXT,
    "govIdNumber" TEXT,
    "photoUrl" TEXT,
    "vehicleNumber" TEXT,
    "hostConfirmation" TEXT NOT NULL DEFAULT 'PENDING',
    "blacklisted" BOOLEAN NOT NULL DEFAULT false,
    "entryTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'CheckedIn',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitor_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_gate_passes" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "leaveType" TEXT NOT NULL,
    "approvedById" UUID NOT NULL,
    "exitTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Approved',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_gate_passes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_houses" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "captainId" UUID,
    "viceCaptainId" UUID,
    "teacherInchargeId" UUID,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_houses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_duty_allocations" (
    "id" UUID NOT NULL,
    "staffId" UUID NOT NULL,
    "dutyType" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_duty_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_substitutions" (
    "id" UUID NOT NULL,
    "leaveApplicationId" UUID NOT NULL,
    "primaryTeacherId" UUID NOT NULL,
    "substituteTeacherId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "timetablePeriodId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_substitutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_diary_entries" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentSigned" BOOLEAN NOT NULL DEFAULT false,
    "parentSignedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_diary_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_news_items" (
    "id" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "national" TEXT NOT NULL,
    "international" TEXT NOT NULL,
    "sports" TEXT NOT NULL,
    "weather" TEXT NOT NULL,
    "importantDay" TEXT,
    "festival" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_news_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grievances" (
    "id" UUID NOT NULL,
    "userType" TEXT NOT NULL,
    "reporterId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assignedToId" UUID,
    "escalationLevel" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grievances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lost_found_items" (
    "id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reporterId" UUID NOT NULL,
    "photoUrl" TEXT,
    "claimantId" UUID,
    "claimedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lost_found_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_lifecycles" (
    "id" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "docType" TEXT NOT NULL,
    "docNumber" TEXT,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "alertDays" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_lifecycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "morning_assemblies" (
    "id" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "campusId" UUID NOT NULL,
    "theme" TEXT NOT NULL,
    "performingSectionId" UUID NOT NULL,
    "supervisingStaffId" UUID NOT NULL,
    "venue" TEXT NOT NULL,
    "activities" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "morning_assemblies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "campuses_name_key" ON "campuses"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "staff_email_key" ON "staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_admissionNumber_key" ON "students"("admissionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "academic_sessions_name_key" ON "academic_sessions"("name");

-- CreateIndex
CREATE INDEX "student_enrollments_sectionId_sessionId_idx" ON "student_enrollments"("sectionId", "sessionId");

-- CreateIndex
CREATE INDEX "student_enrollments_campusId_sectionId_sessionId_idx" ON "student_enrollments"("campusId", "sectionId", "sessionId");

-- CreateIndex
CREATE INDEX "teacher_assignments_staffId_sessionId_idx" ON "teacher_assignments"("staffId", "sessionId");

-- CreateIndex
CREATE INDEX "attendance_records_enrollmentId_date_idx" ON "attendance_records"("enrollmentId", "date");

-- CreateIndex
CREATE INDEX "attendance_records_campusId_date_idx" ON "attendance_records"("campusId", "date");

-- CreateIndex
CREATE INDEX "attendance_records_sessionId_date_idx" ON "attendance_records"("sessionId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "parents_email_key" ON "parents"("email");

-- CreateIndex
CREATE UNIQUE INDEX "parent_students_parentId_studentId_key" ON "parent_students"("parentId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "portal_accounts_username_key" ON "portal_accounts"("username");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_parentId_staffId_key" ON "conversations"("parentId", "staffId");

-- CreateIndex
CREATE INDEX "library_reservations_bookId_status_idx" ON "library_reservations"("bookId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_structures_staffId_key" ON "payroll_structures"("staffId");

-- CreateIndex
CREATE INDEX "fee_invoices_enrollmentId_status_idx" ON "fee_invoices"("enrollmentId", "status");

-- CreateIndex
CREATE INDEX "fee_invoices_campusId_status_idx" ON "fee_invoices"("campusId", "status");

-- CreateIndex
CREATE INDEX "fee_refunds_paymentId_idx" ON "fee_refunds"("paymentId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_timestamp_idx" ON "audit_logs"("userId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "transport_vehicles_vehicleNumber_key" ON "transport_vehicles"("vehicleNumber");

-- CreateIndex
CREATE UNIQUE INDEX "id_cards_idNumber_key" ON "id_cards"("idNumber");

-- CreateIndex
CREATE UNIQUE INDEX "transport_tyres_tyreNumber_key" ON "transport_tyres"("tyreNumber");

-- CreateIndex
CREATE UNIQUE INDEX "transport_batteries_batteryNumber_key" ON "transport_batteries"("batteryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "lms_curriculum_courseId_key" ON "lms_curriculum"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "lms_gradebooks_courseId_key" ON "lms_gradebooks"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "lms_student_portfolios_studentId_key" ON "lms_student_portfolios"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ems_question_paper_items_questionPaperId_questionId_key" ON "ems_question_paper_items"("questionPaperId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "ems_online_submissions_attemptId_key" ON "ems_online_submissions"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "ems_answers_submissionId_questionId_key" ON "ems_answers"("submissionId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "push_tokens_token_key" ON "push_tokens"("token");

-- CreateIndex
CREATE INDEX "push_tokens_userId_userType_idx" ON "push_tokens"("userId", "userType");

-- CreateIndex
CREATE UNIQUE INDEX "health_profiles_studentId_key" ON "health_profiles"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "admission_inquiries_convertedStudentId_key" ON "admission_inquiries"("convertedStudentId");

-- CreateIndex
CREATE INDEX "comments_entityType_entityId_idx" ON "comments"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "attachments_entityType_entityId_idx" ON "attachments"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_definitions_entityType_name_key" ON "workflow_definitions"("entityType", "name");

-- CreateIndex
CREATE UNIQUE INDEX "rules_key_key" ON "rules"("key");

-- CreateIndex
CREATE UNIQUE INDEX "school_houses_name_key" ON "school_houses"("name");

-- AddForeignKey
ALTER TABLE "campuses" ADD CONSTRAINT "campuses_schoolProfileId_fkey" FOREIGN KEY ("schoolProfileId") REFERENCES "school_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_schoolProfileId_fkey" FOREIGN KEY ("schoolProfileId") REFERENCES "school_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "student_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "student_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_cards" ADD CONSTRAINT "report_cards_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_slots" ADD CONSTRAINT "exam_slots_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_slots" ADD CONSTRAINT "exam_slots_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_slots" ADD CONSTRAINT "exam_slots_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_examSlotId_fkey" FOREIGN KEY ("examSlotId") REFERENCES "exam_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "student_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_students" ADD CONSTRAINT "parent_students_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_students" ADD CONSTRAINT "parent_students_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_periods" ADD CONSTRAINT "timetable_periods_timetableId_fkey" FOREIGN KEY ("timetableId") REFERENCES "timetables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_periods" ADD CONSTRAINT "timetable_periods_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_periods" ADD CONSTRAINT "timetable_periods_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_periods" ADD CONSTRAINT "timetable_periods_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "teacher_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_rooms" ADD CONSTRAINT "hostel_rooms_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "hostels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_allocations" ADD CONSTRAINT "hostel_allocations_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "hostel_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_allocations" ADD CONSTRAINT "hostel_allocations_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "student_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_attendance" ADD CONSTRAINT "hostel_attendance_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "student_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_grievances" ADD CONSTRAINT "hostel_grievances_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "hostels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_grievances" ADD CONSTRAINT "hostel_grievances_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "student_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mess_menus" ADD CONSTRAINT "mess_menus_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "hostels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_issues" ADD CONSTRAINT "book_issues_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "library_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_issues" ADD CONSTRAINT "book_issues_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "student_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_fines" ADD CONSTRAINT "library_fines_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "book_issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_reservations" ADD CONSTRAINT "library_reservations_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "library_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "library_reservations" ADD CONSTRAINT "library_reservations_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "student_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "asset_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requisitions" ADD CONSTRAINT "purchase_requisitions_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_applications" ADD CONSTRAINT "leave_applications_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_leave_applications" ADD CONSTRAINT "student_leave_applications_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "student_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_leave_applications" ADD CONSTRAINT "student_leave_applications_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_structures" ADD CONSTRAINT "payroll_structures_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_invoices" ADD CONSTRAINT "fee_invoices_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "student_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_invoices" ADD CONSTRAINT "fee_invoices_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "fee_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_refunds" ADD CONSTRAINT "fee_refunds_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "fee_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_documents" ADD CONSTRAINT "admission_documents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "id_cards" ADD CONSTRAINT "id_cards_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "id_card_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "id_cards" ADD CONSTRAINT "id_cards_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "id_cards" ADD CONSTRAINT "id_cards_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_vehicle_documents" ADD CONSTRAINT "transport_vehicle_documents_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_vehicle_staff" ADD CONSTRAINT "transport_vehicle_staff_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_vehicle_staff" ADD CONSTRAINT "transport_vehicle_staff_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_routes" ADD CONSTRAINT "transport_routes_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_route_stops" ADD CONSTRAINT "transport_route_stops_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "transport_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_student_assignments" ADD CONSTRAINT "transport_student_assignments_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "student_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_student_assignments" ADD CONSTRAINT "transport_student_assignments_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "transport_routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_student_assignments" ADD CONSTRAINT "transport_student_assignments_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "transport_route_stops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_trips" ADD CONSTRAINT "transport_trips_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_trips" ADD CONSTRAINT "transport_trips_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "transport_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_trips" ADD CONSTRAINT "transport_trips_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_trip_logs" ADD CONSTRAINT "transport_trip_logs_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_trip_logs" ADD CONSTRAINT "transport_trip_logs_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "transport_route_stops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_attendance" ADD CONSTRAINT "transport_attendance_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_attendance" ADD CONSTRAINT "transport_attendance_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "student_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_fuel_logs" ADD CONSTRAINT "transport_fuel_logs_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_odometer_logs" ADD CONSTRAINT "transport_odometer_logs_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_daily_checks" ADD CONSTRAINT "transport_daily_checks_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_daily_checks" ADD CONSTRAINT "transport_daily_checks_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_daily_checks" ADD CONSTRAINT "transport_daily_checks_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "transport_trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_inventory" ADD CONSTRAINT "transport_inventory_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "transport_vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_services" ADD CONSTRAINT "transport_services_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_services" ADD CONSTRAINT "transport_services_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "transport_vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_tyres" ADD CONSTRAINT "transport_tyres_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_batteries" ADD CONSTRAINT "transport_batteries_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_breakdowns" ADD CONSTRAINT "transport_breakdowns_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_breakdowns" ADD CONSTRAINT "transport_breakdowns_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_accidents" ADD CONSTRAINT "transport_accidents_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_accidents" ADD CONSTRAINT "transport_accidents_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_expenses" ADD CONSTRAINT "transport_expenses_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transport_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_expenses" ADD CONSTRAINT "transport_expenses_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "transport_vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_courses" ADD CONSTRAINT "lms_courses_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_courses" ADD CONSTRAINT "lms_courses_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_course_sections" ADD CONSTRAINT "lms_course_sections_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "lms_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_course_sections" ADD CONSTRAINT "lms_course_sections_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_course_sections" ADD CONSTRAINT "lms_course_sections_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_curriculum" ADD CONSTRAINT "lms_curriculum_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "lms_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_units" ADD CONSTRAINT "lms_units_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "lms_curriculum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_chapters" ADD CONSTRAINT "lms_chapters_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "lms_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_topics" ADD CONSTRAINT "lms_topics_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "lms_chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_lessons" ADD CONSTRAINT "lms_lessons_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "lms_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_content_resources" ADD CONSTRAINT "lms_content_resources_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lms_lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_assignments" ADD CONSTRAINT "lms_assignments_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lms_lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_submissions" ADD CONSTRAINT "lms_submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "lms_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_submissions" ADD CONSTRAINT "lms_submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_rubrics" ADD CONSTRAINT "lms_rubrics_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "lms_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_question_banks" ADD CONSTRAINT "lms_question_banks_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_questions" ADD CONSTRAINT "lms_questions_questionBankId_fkey" FOREIGN KEY ("questionBankId") REFERENCES "lms_question_banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_quizzes" ADD CONSTRAINT "lms_quizzes_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lms_lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_quiz_attempts" ADD CONSTRAINT "lms_quiz_attempts_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "lms_quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_quiz_attempts" ADD CONSTRAINT "lms_quiz_attempts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_gradebooks" ADD CONSTRAINT "lms_gradebooks_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "lms_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_grades" ADD CONSTRAINT "lms_grades_gradebookId_fkey" FOREIGN KEY ("gradebookId") REFERENCES "lms_gradebooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_grades" ADD CONSTRAINT "lms_grades_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_live_classes" ADD CONSTRAINT "lms_live_classes_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "lms_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_live_classes" ADD CONSTRAINT "lms_live_classes_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_discussion_threads" ADD CONSTRAINT "lms_discussion_threads_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "lms_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_discussion_posts" ADD CONSTRAINT "lms_discussion_posts_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "lms_discussion_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_student_portfolios" ADD CONSTRAINT "lms_student_portfolios_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_badges" ADD CONSTRAINT "lms_badges_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "lms_student_portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_certificates" ADD CONSTRAINT "lms_certificates_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "lms_student_portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_certificates" ADD CONSTRAINT "lms_certificates_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "lms_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_exam_templates" ADD CONSTRAINT "ems_exam_templates_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ems_exam_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_exam_schedules" ADD CONSTRAINT "ems_exam_schedules_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ems_exam_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_exam_schedules" ADD CONSTRAINT "ems_exam_schedules_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ems_exam_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_exam_schedules" ADD CONSTRAINT "ems_exam_schedules_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_exam_schedules" ADD CONSTRAINT "ems_exam_schedules_questionPaperId_fkey" FOREIGN KEY ("questionPaperId") REFERENCES "ems_question_papers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_exam_rooms" ADD CONSTRAINT "ems_exam_rooms_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ems_exam_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_exam_seatings" ADD CONSTRAINT "ems_exam_seatings_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ems_exam_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_exam_seatings" ADD CONSTRAINT "ems_exam_seatings_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_invigilators" ADD CONSTRAINT "ems_invigilators_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ems_exam_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_invigilators" ADD CONSTRAINT "ems_invigilators_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_question_banks" ADD CONSTRAINT "ems_question_banks_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_questions" ADD CONSTRAINT "ems_questions_questionBankId_fkey" FOREIGN KEY ("questionBankId") REFERENCES "ems_question_banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_question_papers" ADD CONSTRAINT "ems_question_papers_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_question_paper_items" ADD CONSTRAINT "ems_question_paper_items_questionPaperId_fkey" FOREIGN KEY ("questionPaperId") REFERENCES "ems_question_papers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_question_paper_items" ADD CONSTRAINT "ems_question_paper_items_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ems_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_exam_attempts" ADD CONSTRAINT "ems_exam_attempts_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ems_exam_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_exam_attempts" ADD CONSTRAINT "ems_exam_attempts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_online_submissions" ADD CONSTRAINT "ems_online_submissions_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ems_exam_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_online_submissions" ADD CONSTRAINT "ems_online_submissions_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ems_exam_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_answers" ADD CONSTRAINT "ems_answers_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ems_online_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_answers" ADD CONSTRAINT "ems_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ems_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_answer_sheets" ADD CONSTRAINT "ems_answer_sheets_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ems_exam_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_evaluation_records" ADD CONSTRAINT "ems_evaluation_records_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ems_exam_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_evaluation_records" ADD CONSTRAINT "ems_evaluation_records_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_moderation_records" ADD CONSTRAINT "ems_moderation_records_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ems_exam_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_moderation_records" ADD CONSTRAINT "ems_moderation_records_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_gradebooks" ADD CONSTRAINT "ems_gradebooks_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ems_exam_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_gradebooks" ADD CONSTRAINT "ems_gradebooks_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_results" ADD CONSTRAINT "ems_results_gradebookId_fkey" FOREIGN KEY ("gradebookId") REFERENCES "ems_gradebooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_results" ADD CONSTRAINT "ems_results_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_report_cards" ADD CONSTRAINT "ems_report_cards_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_report_cards" ADD CONSTRAINT "ems_report_cards_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ems_exam_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_certificates" ADD CONSTRAINT "ems_certificates_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acms_academic_terms" ADD CONSTRAINT "acms_academic_terms_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acms_holiday_master" ADD CONSTRAINT "acms_holiday_master_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acms_working_days" ADD CONSTRAINT "acms_working_days_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acms_events" ADD CONSTRAINT "acms_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "academic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_profiles" ADD CONSTRAINT "health_profiles_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_visits" ADD CONSTRAINT "health_visits_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_visits" ADD CONSTRAINT "health_visits_healthProfileId_fkey" FOREIGN KEY ("healthProfileId") REFERENCES "health_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_visits" ADD CONSTRAINT "health_visits_loggedByStaffId_fkey" FOREIGN KEY ("loggedByStaffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccinations" ADD CONSTRAINT "vaccinations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccinations" ADD CONSTRAINT "vaccinations_healthProfileId_fkey" FOREIGN KEY ("healthProfileId") REFERENCES "health_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discipline_incidents" ADD CONSTRAINT "discipline_incidents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discipline_incidents" ADD CONSTRAINT "discipline_incidents_reportedByStaffId_fkey" FOREIGN KEY ("reportedByStaffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discipline_counseling_notes" ADD CONSTRAINT "discipline_counseling_notes_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "discipline_incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discipline_counseling_notes" ADD CONSTRAINT "discipline_counseling_notes_createdByStaffId_fkey" FOREIGN KEY ("createdByStaffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_inquiries" ADD CONSTRAINT "admission_inquiries_assignedToStaffId_fkey" FOREIGN KEY ("assignedToStaffId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_inquiries" ADD CONSTRAINT "admission_inquiries_convertedStudentId_fkey" FOREIGN KEY ("convertedStudentId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_inquiry_followups" ADD CONSTRAINT "admission_inquiry_followups_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "admission_inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_inquiry_followups" ADD CONSTRAINT "admission_inquiry_followups_createdByStaffId_fkey" FOREIGN KEY ("createdByStaffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_records" ADD CONSTRAINT "visitor_records_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_gate_passes" ADD CONSTRAINT "student_gate_passes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_gate_passes" ADD CONSTRAINT "student_gate_passes_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_houses" ADD CONSTRAINT "school_houses_captainId_fkey" FOREIGN KEY ("captainId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_houses" ADD CONSTRAINT "school_houses_viceCaptainId_fkey" FOREIGN KEY ("viceCaptainId") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_houses" ADD CONSTRAINT "school_houses_teacherInchargeId_fkey" FOREIGN KEY ("teacherInchargeId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_duty_allocations" ADD CONSTRAINT "staff_duty_allocations_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_substitutions" ADD CONSTRAINT "teacher_substitutions_primaryTeacherId_fkey" FOREIGN KEY ("primaryTeacherId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_substitutions" ADD CONSTRAINT "teacher_substitutions_substituteTeacherId_fkey" FOREIGN KEY ("substituteTeacherId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_substitutions" ADD CONSTRAINT "teacher_substitutions_timetablePeriodId_fkey" FOREIGN KEY ("timetablePeriodId") REFERENCES "timetable_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_diary_entries" ADD CONSTRAINT "school_diary_entries_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_diary_entries" ADD CONSTRAINT "school_diary_entries_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grievances" ADD CONSTRAINT "grievances_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lost_found_items" ADD CONSTRAINT "lost_found_items_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "morning_assemblies" ADD CONSTRAINT "morning_assemblies_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "morning_assemblies" ADD CONSTRAINT "morning_assemblies_performingSectionId_fkey" FOREIGN KEY ("performingSectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "morning_assemblies" ADD CONSTRAINT "morning_assemblies_supervisingStaffId_fkey" FOREIGN KEY ("supervisingStaffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

