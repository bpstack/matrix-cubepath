import { z } from 'zod';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
  .refine((val) => {
    const d = new Date(val + 'T00:00:00');
    if (isNaN(d.getTime())) return false;
    const [y, m, day] = val.split('-').map(Number);
    return d.getFullYear() === y && d.getMonth() + 1 === m && d.getDate() === day;
  }, 'Invalid date')
  .refine((val) => {
    const d = new Date(val + 'T00:00:00');
    const now = Date.now();
    return d.getTime() >= now - ONE_YEAR_MS && d.getTime() <= now + ONE_YEAR_MS;
  }, 'Date must be within 1 year from today');

export const noteDateParam = z.object({
  date: dateString,
});

export const noteBody = z.object({
  content: z
    .string()
    .max(5000, 'Content must be 5000 characters or less')
    .transform((val) => val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')),
});
