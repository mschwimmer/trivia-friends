import type { User } from '../generated/prisma/client.js';
import type { prisma } from '../db/prisma.js';

export type ServiceContext = {
  db: typeof prisma;
  actor: User | null;
};
