-- A clue's column must belong to a category on the same board. Fail clearly if
-- legacy data needs repair instead of silently discarding it.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "BoardClue" AS clue
        LEFT JOIN "BoardCategory" AS category
          ON category."boardId" = clue."boardId"
         AND category."colIndex" = clue."colIndex"
        WHERE category."id" IS NULL
    ) THEN
        RAISE EXCEPTION 'Board clues without matching categories must be repaired before migrating';
    END IF;
END $$;

ALTER TABLE "BoardClue"
    ADD CONSTRAINT "BoardClue_boardId_colIndex_fkey"
    FOREIGN KEY ("boardId", "colIndex")
    REFERENCES "BoardCategory"("boardId", "colIndex")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- A session is a complete snapshot. Preserve it when its source board is hard
-- deleted and clear only the optional template reference.
ALTER TABLE "GameSession" DROP CONSTRAINT "GameSession_boardId_fkey";
ALTER TABLE "GameSession" ALTER COLUMN "boardId" DROP NOT NULL;
ALTER TABLE "GameSession"
    ADD CONSTRAINT "GameSession_boardId_fkey"
    FOREIGN KEY ("boardId") REFERENCES "Board"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Board_ownerId_idx" ON "Board"("ownerId");
CREATE INDEX "Board_isPublic_createdAt_idx" ON "Board"("isPublic", "createdAt");
