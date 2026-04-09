import { z } from 'zod';
import { deadlineField } from './common.validation';

export const taskCreateBody = z.object({
  planId: z.number(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  sortOrder: z.number().optional(),
  deadline: deadlineField.optional(),
});

export const taskUpdateBody = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  sortOrder: z.number().optional(),
  planId: z.number().optional(),
  deadline: z.union([deadlineField, z.literal(''), z.null()]).optional(),
});
