import { z } from 'zod';

export const settingsUpsertBody = z.object({
  value: z.string(),
});
