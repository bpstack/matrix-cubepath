import { userDbContext } from './context';

export function getDb() {
  const contextDb = userDbContext.getStore();
  if (!contextDb) throw new Error('No active user DB context. Ensure requireAuth middleware is applied.');
  return contextDb;
}
