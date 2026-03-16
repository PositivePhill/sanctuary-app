import { z } from "zod";

const AVATAR_STYLES = ["amber", "blue", "rose", "emerald", "violet"] as const;

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  avatarStyle: z.enum(AVATAR_STYLES).nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
