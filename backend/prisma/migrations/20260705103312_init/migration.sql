-- CreateEnum
CREATE TYPE "RaceMode" AS ENUM ('RANDOM_ROUTE', 'PIN_DROP');

-- CreateEnum
CREATE TYPE "RaceStatus" AS ENUM ('DRAFT', 'LOBBY', 'COUNTDOWN', 'ACTIVE', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('JOINED', 'READY', 'RACING', 'FINISHED', 'DISCONNECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "replaced_by" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_agent" TEXT,
    "ip_address" TEXT,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "races" (
    "id" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "mode" "RaceMode" NOT NULL,
    "status" "RaceStatus" NOT NULL DEFAULT 'DRAFT',
    "name" TEXT NOT NULL,
    "distance_meters" INTEGER NOT NULL,
    "start_lat" DOUBLE PRECISION NOT NULL,
    "start_lng" DOUBLE PRECISION NOT NULL,
    "end_lat" DOUBLE PRECISION NOT NULL,
    "end_lng" DOUBLE PRECISION NOT NULL,
    "waypoints" JSONB NOT NULL DEFAULT '[]',
    "finish_radius_meters" INTEGER NOT NULL DEFAULT 25,
    "timeout_seconds" INTEGER,
    "countdown_started_at" TIMESTAMP(3),
    "race_started_at" TIMESTAMP(3),
    "race_ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "races_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "race_participants" (
    "id" TEXT NOT NULL,
    "race_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "ParticipantStatus" NOT NULL DEFAULT 'JOINED',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "race_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "race_results" (
    "id" TEXT NOT NULL,
    "race_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "finished_at" TIMESTAMP(3) NOT NULL,
    "elapsed_ms" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "final_distance_meters" DOUBLE PRECISION NOT NULL,
    "average_speed_kmh" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "race_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "races_host_id_idx" ON "races"("host_id");

-- CreateIndex
CREATE INDEX "races_status_idx" ON "races"("status");

-- CreateIndex
CREATE INDEX "race_participants_race_id_idx" ON "race_participants"("race_id");

-- CreateIndex
CREATE INDEX "race_participants_user_id_idx" ON "race_participants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "race_participants_race_id_user_id_key" ON "race_participants"("race_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "race_results_participant_id_key" ON "race_results"("participant_id");

-- CreateIndex
CREATE INDEX "race_results_race_id_idx" ON "race_results"("race_id");

-- CreateIndex
CREATE INDEX "race_results_user_id_idx" ON "race_results"("user_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "races" ADD CONSTRAINT "races_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "race_participants" ADD CONSTRAINT "race_participants_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "race_participants" ADD CONSTRAINT "race_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "race_results" ADD CONSTRAINT "race_results_race_id_fkey" FOREIGN KEY ("race_id") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "race_results" ADD CONSTRAINT "race_results_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "race_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
