import { z } from "zod";

export const setPrioritiesSchema = z.object({
  items: z.array(z.string().trim().min(1).max(300)).max(3),
});
