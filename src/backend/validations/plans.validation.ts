import { z } from 'zod';
import { deadlineField } from './common.validation';

export const planCreateBody = z.object({
  objectiveId: z.number(),
  title: z.string().min(1),
  description: z.string().optional(),
  sortOrder: z.number().optional(),
  deadline: deadlineField.optional(),
});

export const planUpdateBody = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['in_progress', 'completed']).optional(),
  sortOrder: z.number().optional(),
  objectiveId: z.number().optional(),
  deadline: deadlineField.optional(),
});
