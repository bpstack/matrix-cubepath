import { z } from 'zod';

export const missionCreateBody = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

export const missionUpdateBody = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['in_progress', 'completed']).optional(),
});
