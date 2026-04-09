import { z } from 'zod';

export const objectiveCreateBody = z.object({
  missionId: z.number(),
  title: z.string().min(1),
  description: z.string().optional(),
  sortOrder: z.number().optional(),
});

export const objectiveUpdateBody = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['in_progress', 'completed']).optional(),
  sortOrder: z.number().optional(),
  missionId: z.number().optional(),
});
