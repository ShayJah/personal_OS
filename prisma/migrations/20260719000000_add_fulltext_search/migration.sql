-- Full-text search: generated tsvector columns + GIN indexes on Task/Project/Capture

ALTER TABLE "Task"
  ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("description", '')), 'B')
  ) STORED;

CREATE INDEX "Task_searchVector_idx" ON "Task" USING GIN ("searchVector");

ALTER TABLE "Project"
  ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("name", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("description", '')), 'B')
  ) STORED;

CREATE INDEX "Project_searchVector_idx" ON "Project" USING GIN ("searchVector");

ALTER TABLE "Capture"
  ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce("content", ''))
  ) STORED;

CREATE INDEX "Capture_searchVector_idx" ON "Capture" USING GIN ("searchVector");
