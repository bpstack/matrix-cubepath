import { z } from 'zod';

export const deadlineField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Deadline must be YYYY-MM-DD')
  .refine((val) => {
    const d = new Date(val + 'T00:00:00');
    if (isNaN(d.getTime())) return false;
    // Verify the date didn't overflow (e.g. Feb 30 → Mar 2)
    const [y, m, day] = val.split('-').map(Number);
    return d.getFullYear() === y && d.getMonth() + 1 === m && d.getDate() === day;
  }, 'Invalid date');

export const cascadeDeleteBody = z.object({
  action: z.enum(['reassign', 'cascade']).optional(),
  newParentId: z.number().optional(),
});
