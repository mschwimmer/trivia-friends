import { prisma } from './lib/prisma.js';

export type Context = {
  prisma: typeof prisma;
};

export const createContext = async (): Promise<Context> => {
  return {
    prisma,
  };
};
