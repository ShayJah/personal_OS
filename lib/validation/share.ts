import { z } from "zod";

const YEAR_MS = 365 * 24 * 3600_000;

export const createShareSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.enum(["progress", "report"]),
    target: z.string().optional(),
    expiresIn: z.number().int().positive().max(YEAR_MS).optional(),
  }),
  z.object({
    type: z.literal("business"),
    businessId: z.string().min(1),
    detailLevel: z.enum(["overview", "pipeline", "full"]),
    allowEdit: z.boolean().optional(),
    expiresIn: z.number().int().positive().max(YEAR_MS).optional(),
  }),
]);

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
