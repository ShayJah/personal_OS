import { z } from "zod";

export const upsertJournalSchema = z.object({
  date: z.coerce.date(),
  body: z.string().trim().min(1).max(20000),
  mood: z.number().int().min(1).max(5).optional(),
});
