-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "aiSummary" JSONB,
ADD COLUMN     "aiSummaryGeneratedAt" TIMESTAMP(3);
