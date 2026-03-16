import { z } from "zod";

export const createDevotionalSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  scriptureReference: z.string().min(1, "Scripture reference is required").max(100),
  content: z.string().min(1, "Content is required").max(50000),
  publishDate: z.string().min(1, "Publish date is required"),
});

export const updateDevotionalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  scriptureReference: z.string().min(1).max(100).optional(),
  content: z.string().min(1).max(50000).optional(),
  publishDate: z.string().min(1).optional(),
});

export type CreateDevotionalInput = z.infer<typeof createDevotionalSchema>;
export type UpdateDevotionalInput = z.infer<typeof updateDevotionalSchema>;
