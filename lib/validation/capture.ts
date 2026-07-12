import { z } from "zod";

export const captureTypeSchema = z.enum(["text", "voice"]);
export const classificationSchema = z.enum(["task", "idea", "note"]);

export const createCaptureSchema = z.object({
  content: z.string().trim().min(1).max(5000),
  type: captureTypeSchema.default("text"),
});

export const classifyCaptureSchema = z.object({
  classified: classificationSchema,
});
