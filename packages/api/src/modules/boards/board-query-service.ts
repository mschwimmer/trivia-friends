import { requireActor } from '../../application/authorization.js';
import type { ServiceContext } from '../../application/service-context.js';
import { paginationArgs } from '../../application/validation.js';
import { canViewBoard } from './board-policy.js';

export type PageArgs = { limit?: number; offset?: number };

export const boardQueryService = {
  publicBoards: ({ limit, offset }: PageArgs, { db }: ServiceContext) =>
    db.board.findMany({
      where: { isPublic: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      ...paginationArgs(limit, offset),
    }),

  board: async ({ id }: { id: string }, { db, actor }: ServiceContext) => {
    const board = await db.board.findUnique({ where: { id } });

    return board && canViewBoard(board, actor?.id ?? null) ? board : null;
  },

  myBoards: ({ limit, offset }: PageArgs, context: ServiceContext) => {
    const user = requireActor(context.actor);
    return context.db.board.findMany({
      where: { ownerId: user.id },
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
      ...paginationArgs(limit, offset),
    });
  },

  myQuestions: (
    { search, limit, offset }: PageArgs & { search?: string | null },
    context: ServiceContext
  ) => {
    const user = requireActor(context.actor);
    const normalizedSearch = search?.trim();
    return context.db.question.findMany({
      where: {
        creatorId: user.id,
        ...(normalizedSearch
          ? {
              OR: [
                {
                  prompt: {
                    contains: normalizedSearch,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  answer: {
                    contains: normalizedSearch,
                    mode: 'insensitive' as const,
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
      ...paginationArgs(limit, offset),
    });
  },
};
