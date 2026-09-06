import type { User } from '../generated/prisma/client.js';
import { unauthenticated } from './errors.js';

export function requireActor(actor: User | null): User {
  if (!actor) {
    throw unauthenticated();
  }

  return actor;
}
