import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  color: z.string().trim().max(20).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();
