import { z } from "zod";

export const createGoalSchema = z.object({
  horizon: z.enum(["year", "quarter"]).default("year"),
  title: z.string().trim().min(1).max(300),
  why: z.string().trim().max(2000).optional(),
  area: z.string().trim().min(1).max(50).default("personal"),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
});

export const updateGoalSchema = createGoalSchema.partial().extend({
  status: z.enum(["active", "done", "dropped"]).optional(),
});
