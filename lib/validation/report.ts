import { z } from "zod";

export const generateReportSchema = z.object({
  type: z.enum(["daily", "weekly"]),
  referenceDate: z.coerce.date().optional(),
});
