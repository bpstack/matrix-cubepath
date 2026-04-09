import { z } from 'zod';

export const localSettingsSetBody = z.object({
  value: z.string(),
});
