import { boardService } from './board-service.js';

const user = {
  id: 'owner-1',
  authProvider: 'GOOGLE',
  providerUid: 'uid',
  email: 'owner@example.com',
  displayName: 'Owner',
  createdAt: new Date(),
  updatedAt: new Date(),
} as const;

describe('board service', () => {
  it('requires authentication to create a board', async () => {
    await expect(
      boardService.createBoard({ input: { title: 'Board' } }, {
        actor: null,
      } as never)
    ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });

  it('creates the default 5x5 board and standard clue values atomically', async () => {
    const createBoard = jest.fn().mockResolvedValue({ id: 'board-1' });
    const createCategory = jest.fn().mockResolvedValue({});
    const createQuestion = jest.fn().mockImplementation(async () => ({
      id: `question-${createQuestion.mock.calls.length}`,
    }));
    const createClue = jest.fn().mockResolvedValue({});
    const transaction = jest.fn(async (action) =>
      action({
        board: { create: createBoard },
        boardCategory: { create: createCategory },
        question: { create: createQuestion },
        boardClue: { create: createClue },
      })
    );

    await boardService.createBoard(
      { input: { title: '  Friday Trivia  ', isPublic: false } },
      { actor: user, db: { $transaction: transaction } } as never
    );

    expect(createCategory).toHaveBeenCalledTimes(5);
    expect(createQuestion).toHaveBeenCalledTimes(25);
    expect(createClue).toHaveBeenCalledTimes(25);
    expect(
      createClue.mock.calls.slice(0, 5).map(([{ data }]) => data.value)
    ).toEqual([200, 400, 600, 800, 1000]);
    expect(createBoard).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ownerId: user.id,
        title: 'Friday Trivia',
        isPublic: false,
      }),
    });
  });

  it('prevents another user from changing board metadata', async () => {
    const board = { id: 'board-1', ownerId: 'someone-else', isPublic: true };
    await expect(
      boardService.updateBoard({ id: board.id, input: { title: 'Stolen' } }, {
        actor: user,
        db: { board: { findUnique: jest.fn().mockResolvedValue(board) } },
      } as never)
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('requires the selected Daily Double clue to belong to the board', async () => {
    const board = { id: 'board-1', ownerId: user.id, isPublic: true };
    const findUnique = jest
      .fn()
      .mockResolvedValueOnce(board)
      .mockResolvedValueOnce({ id: 'clue-1', boardId: 'other-board' });

    await expect(
      boardService.selectDailyDouble({ boardId: board.id, clueId: 'clue-1' }, {
        actor: user,
        db: {
          board: { findUnique },
          boardClue: { findUnique },
        },
      } as never)
    ).rejects.toMatchObject({ code: 'BAD_USER_INPUT' });
  });
});
