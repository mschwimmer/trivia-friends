import type { Request } from 'express';
import { prisma } from './lib/prisma.js';

export type Context = {
  prisma: typeof prisma;
  request: Request;
};

export type CreateContextOptions = {
  req: Request;
};

export const createContext = async ({
  req,
}: CreateContextOptions): Promise<Context> => {
  return {
    prisma,
    request: req,
  };
};

export default createContext;
