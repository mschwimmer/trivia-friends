import type {
  SessionClue,
  SessionPlayer,
} from '../../generated/prisma/client.js';
import { createGuestHostToken } from '../../auth/guest-host-token.js';
import { badUserInput, conflict, notFound } from '../../application/errors.js';
import {
  canViewBoard,
  requirePlayableBoard,
  BoardNotPlayableError,
} from '../boards/board-policy.js';
import {
  boardCategoryOrderBy,
  boardClueOrderBy,
} from '../boards/board-ordering.js';
import type { ServiceContext } from '../../application/service-context.js';
import {
  optionalText,
  positiveInteger,
  requiredText,
} from '../../application/validation.js';
import { requireSessionHost, sessionOrThrow } from './session-policy.js';

type StartGameSessionInput = {
  boardId: string;
  title?: string | null;
  playerNames: string[];
};

type HostTokenArgs = { guestHostToken?: string | null };

function normalizedPlayerNames(names: readonly string[]): string[] {
  if (names.length < 1) {
    throw badUserInput('At least one player is required.');
  }

  const normalized = names.map((name) => requiredText(name, 'Player name', 50));
  const folded = normalized.map((name) => name.toLocaleLowerCase());

  if (new Set(folded).size !== folded.length) {
    throw badUserInput('Player names must be unique within a session.');
  }

  return normalized;
}

async function authorizedPlayer(
  context: ServiceContext,
  id: string,
  guestHostToken?: string | null
): Promise<SessionPlayer> {
  const player = await context.db.sessionPlayer.findUnique({
    where: { id },
  });
  if (!player) throw notFound('Session player');
  const session = await sessionOrThrow(context, player.sessionId);
  requireSessionHost(session, context.actor?.id ?? null, guestHostToken);
  return player;
}

async function authorizedClue(
  context: ServiceContext,
  id: string,
  guestHostToken?: string | null
): Promise<SessionClue> {
  const clue = await context.db.sessionClue.findUnique({ where: { id } });
  if (!clue) throw notFound('Session clue');
  const session = await sessionOrThrow(context, clue.sessionId);
  requireSessionHost(session, context.actor?.id ?? null, guestHostToken);
  return clue;
}

async function ensureUniquePlayerName(
  context: ServiceContext,
  sessionId: string,
  name: string,
  excludedPlayerId?: string
) {
  const duplicate = await context.db.sessionPlayer.findFirst({
    where: {
      sessionId,
      name: { equals: name, mode: 'insensitive' },
      ...(excludedPlayerId ? { id: { not: excludedPlayerId } } : {}),
    },
    select: { id: true },
  });

  if (duplicate) {
    throw conflict('Player names must be unique within a session.');
  }
}

export const sessionService = {
  gameSession: async (
    { id, guestHostToken }: { id: string; guestHostToken?: string | null },
    context: ServiceContext
  ) => {
    const session = await context.db.gameSession.findUnique({ where: { id } });
    if (!session) return null;
    requireSessionHost(session, context.actor?.id ?? null, guestHostToken);
    return session;
  },

  startGameSession: async (
    { input }: { input: StartGameSessionInput },
    context: ServiceContext
  ) => {
    const board = await context.db.board.findUnique({
      where: { id: input.boardId },
      include: {
        categories: { orderBy: boardCategoryOrderBy },
        clues: {
          orderBy: boardClueOrderBy,
          include: { question: true },
        },
      },
    });

    if (!board || !canViewBoard(board, context.actor?.id ?? null)) {
      throw notFound('Board');
    }

    try {
      requirePlayableBoard(board);
    } catch (error) {
      if (error instanceof BoardNotPlayableError) {
        throw badUserInput(error.message);
      }
      throw error;
    }

    if (board.categories.some(({ title }) => !title.trim())) {
      throw badUserInput('Every category needs a title before play.');
    }
    if (
      board.clues.some(
        ({ question }) => !question.prompt.trim() || !question.answer.trim()
      )
    ) {
      throw badUserInput('Every clue needs a prompt and answer before play.');
    }

    const playerNames = normalizedPlayerNames(input.playerNames);
    const title = optionalText(input.title, 'Session title', 100);
    const guestCredential = context.actor ? null : createGuestHostToken();
    const categoryTitles = new Map(
      board.categories.map((category) => [category.colIndex, category.title])
    );

    const session = await context.db.gameSession.create({
      data: {
        boardId: board.id,
        hostUserId: context.actor?.id ?? null,
        guestHostTokenHash: guestCredential?.hash ?? null,
        title,
        players: {
          create: playerNames.map((name, position) => ({ name, position })),
        },
        clues: {
          create: board.clues.map((clue) => ({
            boardClueId: clue.id,
            colIndex: clue.colIndex,
            rowIndex: clue.rowIndex,
            value: clue.value,
            categoryTitle: categoryTitles.get(clue.colIndex)!,
            prompt: clue.question.prompt,
            answer: clue.question.answer,
            isDailyDouble: clue.id === board.dailyDoubleClueId,
          })),
        },
      },
    });

    return {
      session,
      guestHostToken: guestCredential?.token ?? null,
    };
  },

  addSessionPlayer: async (
    {
      sessionId,
      name,
      guestHostToken,
    }: { sessionId: string; name: string } & HostTokenArgs,
    context: ServiceContext
  ) => {
    const session = await sessionOrThrow(context, sessionId);
    requireSessionHost(session, context.actor?.id ?? null, guestHostToken);
    const normalizedName = requiredText(name, 'Player name', 50);
    await ensureUniquePlayerName(context, sessionId, normalizedName);
    const lastPlayer = await context.db.sessionPlayer.findFirst({
      where: { sessionId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return context.db.sessionPlayer.create({
      data: {
        sessionId,
        name: normalizedName,
        position: (lastPlayer?.position ?? -1) + 1,
      },
    });
  },

  renameSessionPlayer: async (
    { id, name, guestHostToken }: { id: string; name: string } & HostTokenArgs,
    context: ServiceContext
  ) => {
    const player = await authorizedPlayer(context, id, guestHostToken);
    const normalizedName = requiredText(name, 'Player name', 50);
    await ensureUniquePlayerName(
      context,
      player.sessionId,
      normalizedName,
      player.id
    );
    return context.db.sessionPlayer.update({
      where: { id },
      data: { name: normalizedName },
    });
  },

  removeSessionPlayer: async (
    { id, guestHostToken }: { id: string } & HostTokenArgs,
    context: ServiceContext
  ) => {
    await authorizedPlayer(context, id, guestHostToken);
    await context.db.sessionPlayer.delete({ where: { id } });
    return true;
  },

  openSessionClue: async (
    { id, guestHostToken }: { id: string } & HostTokenArgs,
    context: ServiceContext
  ) => {
    await authorizedClue(context, id, guestHostToken);
    const updated = await context.db.sessionClue.updateMany({
      where: { id, opened: false },
      data: { opened: true },
    });
    if (updated.count !== 1) {
      throw conflict('This clue has already been opened.');
    }
    return context.db.sessionClue.findUniqueOrThrow({ where: { id } });
  },

  adjustPlayerScore: async (
    {
      playerId,
      clueId,
      direction,
      guestHostToken,
    }: {
      playerId: string;
      clueId: string;
      direction: 'ADD' | 'SUBTRACT';
    } & HostTokenArgs,
    context: ServiceContext
  ) => {
    const player = await authorizedPlayer(context, playerId, guestHostToken);
    const clue = await authorizedClue(context, clueId, guestHostToken);
    if (player.sessionId !== clue.sessionId) {
      throw badUserInput('Player and clue must belong to the same session.');
    }
    if (!clue.opened) {
      throw conflict('Open the clue before changing a score.');
    }
    if (clue.isDailyDouble) {
      throw badUserInput('Use the Daily Double result mutation for this clue.');
    }

    return context.db.sessionPlayer.update({
      where: { id: player.id },
      data: {
        score:
          direction === 'ADD'
            ? { increment: clue.value }
            : { decrement: clue.value },
      },
    });
  },

  applyDailyDoubleResult: async (
    {
      playerId,
      clueId,
      wager,
      correct,
      guestHostToken,
    }: {
      playerId: string;
      clueId: string;
      wager: number;
      correct: boolean;
    } & HostTokenArgs,
    context: ServiceContext
  ) => {
    const player = await authorizedPlayer(context, playerId, guestHostToken);
    const clue = await authorizedClue(context, clueId, guestHostToken);
    if (player.sessionId !== clue.sessionId) {
      throw badUserInput('Player and clue must belong to the same session.');
    }
    if (!clue.opened) {
      throw conflict('Open the clue before applying a Daily Double result.');
    }
    if (!clue.isDailyDouble) {
      throw badUserInput('This clue is not the Daily Double.');
    }

    const amount = positiveInteger(wager, 'Daily Double wager');
    return context.db.sessionPlayer.update({
      where: { id: player.id },
      data: {
        score: correct ? { increment: amount } : { decrement: amount },
      },
    });
  },
};
