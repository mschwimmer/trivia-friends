import type { User } from '../generated/prisma/client.js';
import { GraphQLError } from 'graphql';
import {
  BoardAccessError,
  requireBoardOwner,
  type BoardAccess,
} from '../domain/board-policy.js';
import type { Context } from '../context.js';
import { unauthenticatedError } from '../auth/request-identity.js';

export function requireCurrentUser(context: Context): User {
  if (!context.currentUser) {
    throw unauthenticatedError();
  }

  return context.currentUser;
}

export function requireBoardOwnerForResolver(
  board: Pick<BoardAccess, 'ownerId'>,
  context: Context
): User {
  const currentUser = requireCurrentUser(context);

  try {
    requireBoardOwner(board, currentUser.id);
  } catch (error) {
    if (error instanceof BoardAccessError) {
      throw new GraphQLError('Only the board owner can modify this board.', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    throw error;
  }

  return currentUser;
}
