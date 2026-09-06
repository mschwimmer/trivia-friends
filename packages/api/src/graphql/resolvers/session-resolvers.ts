import type { Context } from '../context.js';
import type { GameSession } from '../../generated/prisma/client.js';
import {
  sessionClueOrderBy,
  sessionPlayerOrderBy,
} from '../../modules/sessions/session-ordering.js';
import { sessionService } from '../../modules/sessions/session-service.js';
import { serviceContext } from './helpers.js';

export const sessionResolvers = {
  Query: {
    gameSession: (
      _parent: unknown,
      args: Parameters<typeof sessionService.gameSession>[0],
      context: Context
    ) => sessionService.gameSession(args, serviceContext(context)),
  },
  Mutation: {
    startGameSession: (
      _parent: unknown,
      args: Parameters<typeof sessionService.startGameSession>[0],
      context: Context
    ) => sessionService.startGameSession(args, serviceContext(context)),
    addSessionPlayer: (
      _parent: unknown,
      args: Parameters<typeof sessionService.addSessionPlayer>[0],
      context: Context
    ) => sessionService.addSessionPlayer(args, serviceContext(context)),
    renameSessionPlayer: (
      _parent: unknown,
      args: Parameters<typeof sessionService.renameSessionPlayer>[0],
      context: Context
    ) => sessionService.renameSessionPlayer(args, serviceContext(context)),
    removeSessionPlayer: (
      _parent: unknown,
      args: Parameters<typeof sessionService.removeSessionPlayer>[0],
      context: Context
    ) => sessionService.removeSessionPlayer(args, serviceContext(context)),
    openSessionClue: (
      _parent: unknown,
      args: Parameters<typeof sessionService.openSessionClue>[0],
      context: Context
    ) => sessionService.openSessionClue(args, serviceContext(context)),
    adjustPlayerScore: (
      _parent: unknown,
      args: Parameters<typeof sessionService.adjustPlayerScore>[0],
      context: Context
    ) => sessionService.adjustPlayerScore(args, serviceContext(context)),
    applyDailyDoubleResult: (
      _parent: unknown,
      args: Parameters<typeof sessionService.applyDailyDoubleResult>[0],
      context: Context
    ) => sessionService.applyDailyDoubleResult(args, serviceContext(context)),
  },
  GameSession: {
    board: (session: GameSession, _args: unknown, context: Context) =>
      session.boardId
        ? context.prisma.board.findUnique({ where: { id: session.boardId } })
        : null,
    hostUser: (session: GameSession, _args: unknown, context: Context) =>
      session.hostUserId
        ? context.prisma.user.findUnique({ where: { id: session.hostUserId } })
        : null,
    players: (session: GameSession, _args: unknown, context: Context) =>
      context.prisma.sessionPlayer.findMany({
        where: { sessionId: session.id },
        orderBy: sessionPlayerOrderBy,
      }),
    clues: (session: GameSession, _args: unknown, context: Context) =>
      context.prisma.sessionClue.findMany({
        where: { sessionId: session.id },
        orderBy: sessionClueOrderBy,
      }),
  },
};
