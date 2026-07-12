import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(5000).optional(),
  projectId: z.string().trim().min(1).optional(),
  dueDate: z.coerce.date().optional(),
  priority: z.number().int().min(1).max(3).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  completed: z.boolean().optional(),
  projectId: z.string().trim().min(1).nullable().optional(),
});
