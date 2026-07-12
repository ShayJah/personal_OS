import { z } from "zod";

export const createHabitSchema = z.object({
  name: z.string().trim().min(1).max(200),
  frequency: z.enum(["daily", "weekly"]).default("daily"),
});

export const updateHabitSchema = createHabitSchema.partial();

export const logHabitSchema = z.object({
  date: z.coerce.date(),
  completed: z.boolean().default(true),
});
