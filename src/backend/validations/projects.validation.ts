import { z } from 'zod';

const urlField = z
  .string()
  .max(500)
  .refine(
    (val) => !val || /^(https?:\/\/.+|[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+)$/.test(val),
    'Invalid URL or GitHub repo format (owner/repo)',
  );

export const projectCreateBody = z.object({
  name: z.string().min(1),
  path: z.string().optional(),
  description: z.string().optional(),
  url: urlField.optional(),
  status: z.enum(['active', 'paused', 'completed', 'archived']).optional(),
  tags: z.array(z.string()).optional(),
});

export const projectUpdateBody = z.object({
  name: z.string().min(1).optional(),
  path: z.string().optional(),
  description: z.string().optional(),
  url: urlField.optional(),
  status: z.enum(['active', 'paused', 'completed', 'archived']).optional(),
  tags: z.array(z.string()).optional(),
});

export const projectLinkBody = z.object({
  linkableType: z.enum(['mission', 'objective', 'plan', 'task']),
  linkableId: z.number(),
});
