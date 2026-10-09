import { z } from "zod";

export const shareSettingsSchema = z
  .object({
    shareProgressPage: z.boolean(),
    shareReports: z.boolean(),
    shareTasks: z.boolean(),
    shareHabits: z.boolean(),
    shareHighlights: z.boolean(),
  })
  .partial()
  .strict();
