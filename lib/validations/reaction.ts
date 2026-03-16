import { z } from "zod";

const REACTION_TYPES = ["PRAYING", "AMEN", "PRAISE"] as const;

export const toggleReactionSchema = z.object({
  type: z.enum(REACTION_TYPES),
});

export type ToggleReactionInput = z.infer<typeof toggleReactionSchema>;
