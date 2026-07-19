import { z } from "zod";

export const createBusinessSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
});

export const addLeadSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(300).optional().or(z.literal("")),
  company: z.string().trim().max(200).optional(),
});

export const updateStageSchema = z.object({
  stage: z.enum(["lead", "contacted", "qualified", "proposal", "won", "lost"]),
});

export const addActivitySchema = z.object({
  kind: z.enum(["call", "meeting", "note"]),
  body: z.string().trim().min(1).max(5000),
});
