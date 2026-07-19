import "server-only";
import { prisma } from "@/lib/db";

export type SearchResultType = "task" | "project" | "capture";

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  snippet: string | null;
  href: string;
}

const RESULT_LIMIT = 20;

export async function searchAll(userId: string, query: string): Promise<SearchResult[]> {
  const results = await prisma.$queryRaw<
    Array<{
      type: SearchResultType;
      id: string;
      title: string;
      snippet: string | null;
      rank: number;
    }>
  >`
    SELECT * FROM (
      SELECT
        'task' AS type,
        "id",
        "title",
        "description" AS snippet,
        ts_rank("searchVector", websearch_to_tsquery('english', ${query})) AS rank
      FROM "Task"
      WHERE "userId" = ${userId}
        AND "searchVector" @@ websearch_to_tsquery('english', ${query})

      UNION ALL

      SELECT
        'project' AS type,
        "id",
        "name" AS title,
        "description" AS snippet,
        ts_rank("searchVector", websearch_to_tsquery('english', ${query})) AS rank
      FROM "Project"
      WHERE "userId" = ${userId}
        AND "searchVector" @@ websearch_to_tsquery('english', ${query})

      UNION ALL

      SELECT
        'capture' AS type,
        "id",
        left("content", 80) AS title,
        NULL AS snippet,
        ts_rank("searchVector", websearch_to_tsquery('english', ${query})) AS rank
      FROM "Capture"
      WHERE "userId" = ${userId}
        AND "searchVector" @@ websearch_to_tsquery('english', ${query})
    ) combined
    ORDER BY rank DESC
    LIMIT ${RESULT_LIMIT}
  `;

  return results.map((row) => ({
    type: row.type,
    id: row.id,
    title: row.title,
    snippet: row.snippet,
    href:
      row.type === "project"
        ? `/projects/${row.id}`
        : row.type === "task"
          ? "/tasks"
          : "/capture",
  }));
}
