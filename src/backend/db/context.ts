import { AsyncLocalStorage } from 'async_hooks';
import { drizzle } from 'drizzle-orm/sql-js';
import * as schema from './schema';

export type UserDb = ReturnType<typeof drizzle<typeof schema>>;

// Per-request context: stores the Drizzle DB for the current user.
// All repository calls within a request will transparently use this.
export const userDbContext = new AsyncLocalStorage<UserDb>();
