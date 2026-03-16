import { z } from "zod";

export const createPrayerSchema = z.object({
  content: z.string().min(1, "Content is required").max(10000),
  isAnonymous: z.boolean().default(false),
});

export const updatePrayerSchema = z.object({
  status: z.enum(["ACTIVE", "ANSWERED"]).optional(),
});

export const createCommentSchema = z.object({
  prayerRequestId: z.string().min(1, "Prayer request ID is required"),
  content: z.string().min(1, "Content is required").max(5000),
});

export type CreatePrayerInput = z.infer<typeof createPrayerSchema>;
export type UpdatePrayerInput = z.infer<typeof updatePrayerSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
