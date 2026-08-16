-- Preserve an existing Daily Double flag when a board does not already have a
-- pointer. If bad legacy data contains multiple flags, choose deterministically;
-- application validation prevents that board from being played until corrected.
UPDATE "Board" AS board
SET "dailyDoubleClueId" = selected."id"
FROM (
    SELECT DISTINCT ON ("boardId") "boardId", "id"
    FROM "BoardClue"
    WHERE "isDailyDouble" = true
    ORDER BY "boardId", "id"
) AS selected
WHERE board."id" = selected."boardId"
  AND board."dailyDoubleClueId" IS NULL;

-- Questions now have a creator authorization boundary. Infer ownership for
-- existing questions from the oldest board that uses each question.
ALTER TABLE "Question" ADD COLUMN "creatorId" TEXT;

UPDATE "Question" AS question
SET "creatorId" = inferred."ownerId"
FROM (
    SELECT DISTINCT ON (clue."questionId")
        clue."questionId",
        board."ownerId"
    FROM "BoardClue" AS clue
    JOIN "Board" AS board ON board."id" = clue."boardId"
    ORDER BY clue."questionId", board."createdAt", board."id"
) AS inferred
WHERE question."id" = inferred."questionId";

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "Question" WHERE "creatorId" IS NULL) THEN
        RAISE EXCEPTION 'Cannot infer creators for unused questions; assign or remove them before migrating';
    END IF;
END $$;

ALTER TABLE "Question" ALTER COLUMN "creatorId" SET NOT NULL;
CREATE INDEX "Question_creatorId_idx" ON "Question"("creatorId");
ALTER TABLE "Question"
    ADD CONSTRAINT "Question_creatorId_fkey"
    FOREIGN KEY ("creatorId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Board.dailyDoubleClueId is now the only source of truth.
ALTER TABLE "BoardClue" DROP COLUMN "isDailyDouble";

-- Give existing players a deterministic order before making position required.
ALTER TABLE "SessionPlayer" ADD COLUMN "position" INTEGER;

WITH ordered_players AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "sessionId"
            ORDER BY "createdAt", "id"
        ) - 1 AS position
    FROM "SessionPlayer"
)
UPDATE "SessionPlayer" AS player
SET "position" = ordered_players.position
FROM ordered_players
WHERE player."id" = ordered_players."id";

ALTER TABLE "SessionPlayer" ALTER COLUMN "position" SET NOT NULL;
DROP INDEX "SessionPlayer_sessionId_idx";
CREATE UNIQUE INDEX "SessionPlayer_sessionId_position_key"
    ON "SessionPlayer"("sessionId", "position");
CREATE INDEX "SessionPlayer_sessionId_name_idx"
    ON "SessionPlayer"("sessionId", "name");
