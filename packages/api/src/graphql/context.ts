import type { Request } from 'express';
import type { User } from '../generated/prisma/client.js';
import {
  resolveRequestIdentity,
  type VerifyIdToken,
} from '../auth/request-identity.js';
import { prisma } from '../db/prisma.js';

export type Context = {
  prisma: typeof prisma;
  request: Request;
  currentUser: User | null;
};

export type CreateContextOptions = {
  req: Request;
  prismaClient?: typeof prisma;
  verifyIdToken?: VerifyIdToken;
};

export const createContext = async ({
  req,
  prismaClient = prisma,
  verifyIdToken,
}: CreateContextOptions): Promise<Context> => {
  const currentUser = await resolveRequestIdentity({
    authorizationHeader: req.get('authorization'),
    prismaClient,
    verifyIdToken,
  });

  return {
    prisma: prismaClient,
    request: req,
    currentUser,
  };
};

export default createContext;
