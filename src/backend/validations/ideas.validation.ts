import { z } from 'zod';

export const ideaCreateBody = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  targetType: z.enum(['mission', 'objective', 'plan', 'task']).optional(),
  targetId: z.number().optional(),
  projectId: z.number().optional(),
});

export const ideaUpdateBody = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'evaluating', 'approved', 'rejected', 'promoted']).optional(),
  targetType: z.enum(['mission', 'objective', 'plan', 'task']).nullable().optional(),
  targetId: z.number().nullable().optional(),
  projectId: z.number().nullable().optional(),
});

export const ideaEvaluateBody = z.object({
  alignmentScore: z.number().min(1).max(10),
  impactScore: z.number().min(1).max(10),
  costScore: z.number().min(1).max(10),
  riskScore: z.number().min(1).max(10),
  reasoning: z.string().optional(),
});

export const ideaDecideBody = z.object({
  decision: z.enum(['approved', 'rejected']),
});

export const ideaPromoteBody = z.object({
  type: z.enum(['task', 'plan', 'objective', 'project']),
  parentId: z.number().optional(),
});
