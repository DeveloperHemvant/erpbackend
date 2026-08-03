-- AlterTable
ALTER TABLE "ems_exam_schedules" ADD COLUMN     "durationMin" INTEGER,
ADD COLUMN     "mode" TEXT NOT NULL DEFAULT 'OFFLINE',
ADD COLUMN     "questionPaperId" UUID;

-- AlterTable
ALTER TABLE "ems_questions" ADD COLUMN     "correctOptionId" TEXT,
ADD COLUMN     "marks" DOUBLE PRECISION NOT NULL DEFAULT 1,
ADD COLUMN     "options" JSONB;

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

-- CreateIndex
CREATE UNIQUE INDEX "ems_question_paper_items_questionPaperId_questionId_key" ON "ems_question_paper_items"("questionPaperId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "ems_online_submissions_attemptId_key" ON "ems_online_submissions"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "ems_answers_submissionId_questionId_key" ON "ems_answers"("submissionId", "questionId");

-- AddForeignKey
ALTER TABLE "ems_exam_schedules" ADD CONSTRAINT "ems_exam_schedules_questionPaperId_fkey" FOREIGN KEY ("questionPaperId") REFERENCES "ems_question_papers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_question_paper_items" ADD CONSTRAINT "ems_question_paper_items_questionPaperId_fkey" FOREIGN KEY ("questionPaperId") REFERENCES "ems_question_papers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_question_paper_items" ADD CONSTRAINT "ems_question_paper_items_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ems_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_online_submissions" ADD CONSTRAINT "ems_online_submissions_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ems_exam_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_online_submissions" ADD CONSTRAINT "ems_online_submissions_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ems_exam_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_answers" ADD CONSTRAINT "ems_answers_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ems_online_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ems_answers" ADD CONSTRAINT "ems_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ems_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

