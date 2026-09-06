import { sessionService } from './session-service.js';

const owner = {
  id: 'owner-1',
  authProvider: 'GOOGLE',
  providerUid: 'uid',
  email: 'owner@example.com',
  displayName: 'Owner',
  createdAt: new Date(),
  updatedAt: new Date(),
} as const;

const playableBoard = {
  id: 'board-1',
  ownerId: owner.id,
  isPublic: true,
  dailyDoubleClueId: 'clue-1',
  categories: [{ id: 'category-1', colIndex: 0, title: 'Science' }],
  clues: [
    {
      id: 'clue-1',
      colIndex: 0,
      rowIndex: 0,
      value: 200,
      question: { prompt: 'Element H?', answer: 'Hydrogen' },
    },
  ],
};

describe('session service', () => {
  beforeAll(() => {
    process.env.GUEST_TOKEN_PEPPER = 'test-only-pepper';
  });

  it('atomically snapshots a playable board for a guest host', async () => {
    const create = jest.fn().mockImplementation(async ({ data }) => ({
      id: 'session-1',
      ...data,
    }));

    const result = await sessionService.startGameSession(
      {
        input: {
          boardId: playableBoard.id,
          title: 'Friday game',
          playerNames: [' Alice ', 'Bob'],
        },
      },
      {
        actor: null,
        db: {
          board: { findUnique: jest.fn().mockResolvedValue(playableBoard) },
          gameSession: { create },
        },
      } as never
    );

    expect(result.guestHostToken).toEqual(expect.any(String));
    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        hostUserId: null,
        guestHostTokenHash: expect.any(String),
        players: {
          create: [
            { name: 'Alice', position: 0 },
            { name: 'Bob', position: 1 },
          ],
        },
        clues: {
          create: [
            expect.objectContaining({
              prompt: 'Element H?',
              answer: 'Hydrogen',
              categoryTitle: 'Science',
              isDailyDouble: true,
            }),
          ],
        },
      }),
    });
    expect(create.mock.calls[0][0].data.guestHostTokenHash).not.toBe(
      result.guestHostToken
    );
  });

  it('rejects a board with blank clue content', async () => {
    await expect(
      sessionService.startGameSession(
        {
          input: {
            boardId: playableBoard.id,
            playerNames: ['Alice'],
          },
        },
        {
          actor: owner,
          db: {
            board: {
              findUnique: jest.fn().mockResolvedValue({
                ...playableBoard,
                clues: [
                  {
                    ...playableBoard.clues[0],
                    question: { prompt: '', answer: '' },
                  },
                ],
              }),
            },
          },
        } as never
      )
    ).rejects.toMatchObject({ code: 'BAD_USER_INPUT' });
  });

  it('opens a clue exactly once', async () => {
    const session = {
      id: 'session-1',
      hostUserId: owner.id,
      guestHostTokenHash: null,
    };
    const clue = { id: 'clue-1', sessionId: session.id, opened: false };
    const context = {
      actor: owner,
      db: {
        sessionClue: {
          findUnique: jest.fn().mockResolvedValue(clue),
          updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
        gameSession: { findUnique: jest.fn().mockResolvedValue(session) },
      },
    } as never;

    await expect(
      sessionService.openSessionClue({ id: clue.id }, context)
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('rejects score changes before a clue is opened', async () => {
    const session = {
      id: 'session-1',
      hostUserId: owner.id,
      guestHostTokenHash: null,
    };
    const player = { id: 'player-1', sessionId: session.id };
    const clue = {
      id: 'clue-1',
      sessionId: session.id,
      opened: false,
      isDailyDouble: false,
      value: 200,
    };
    const context = {
      actor: owner,
      db: {
        sessionPlayer: { findUnique: jest.fn().mockResolvedValue(player) },
        sessionClue: { findUnique: jest.fn().mockResolvedValue(clue) },
        gameSession: { findUnique: jest.fn().mockResolvedValue(session) },
      },
    } as never;

    await expect(
      sessionService.adjustPlayerScore(
        { playerId: player.id, clueId: clue.id, direction: 'ADD' },
        context
      )
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });
});
