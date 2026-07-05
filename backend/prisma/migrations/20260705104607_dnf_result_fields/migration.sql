-- AlterTable
ALTER TABLE "race_results" ADD COLUMN     "did_not_finish" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "finished_at" DROP NOT NULL,
ALTER COLUMN "elapsed_ms" DROP NOT NULL,
ALTER COLUMN "rank" DROP NOT NULL;
