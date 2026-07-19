import { z } from "zod";

export const logMetricSchema = z.object({
  kind: z.string().trim().min(1).max(50),
  value: z.number(),
  unit: z.string().trim().max(20).optional(),
  date: z.coerce.date(),
});
