import { z } from "zod";

export const sendCoachMessageSchema = z.object({
  content: z.string().trim().min(1).max(4000),
});
