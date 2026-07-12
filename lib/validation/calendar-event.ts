import { z } from "zod";

export const createEventSchema = z
  .object({
    title: z.string().trim().min(1).max(300),
    description: z.string().trim().max(5000).optional(),
    location: z.string().trim().max(300).optional(),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    taskId: z.string().trim().min(1).optional(),
  })
  .refine((data) => data.endAt >= data.startAt, {
    message: "End time must be after start time",
    path: ["endAt"],
  });

export const updateEventSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().trim().max(5000).optional(),
  location: z.string().trim().max(300).optional(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  taskId: z.string().trim().min(1).nullable().optional(),
});
