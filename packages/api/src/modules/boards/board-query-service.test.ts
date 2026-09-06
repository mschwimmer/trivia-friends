import { boardQueryService } from './board-query-service.js';

const user = {
  id: 'owner-1',
  authProvider: 'GOOGLE',
  providerUid: 'uid',
  email: 'owner@example.com',
  displayName: 'Owner',
  createdAt: new Date(),
  updatedAt: new Date(),
} as const;

describe('board query service', () => {
  it('browses only public boards with bounded pagination', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    await boardQueryService.publicBoards({ limit: 10, offset: 5 }, {
      db: { board: { findMany } },
    } as never);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isPublic: true },
        take: 10,
        skip: 5,
      })
    );
  });

  it('hides a private board from guests and other users', async () => {
    const board = { id: 'board-1', ownerId: 'owner-1', isPublic: false };
    const context = {
      actor: null,
      db: { board: { findUnique: jest.fn().mockResolvedValue(board) } },
    } as never;

    await expect(
      boardQueryService.board({ id: board.id }, context)
    ).resolves.toBeNull();
  });

  it('returns an owned private board to its owner', async () => {
    const board = { id: 'board-1', ownerId: user.id, isPublic: false };
    const context = {
      actor: user,
      db: { board: { findUnique: jest.fn().mockResolvedValue(board) } },
    } as never;

    await expect(
      boardQueryService.board({ id: board.id }, context)
    ).resolves.toBe(board);
  });

  it('requires authentication for owned-board browsing', () => {
    expect(() =>
      boardQueryService.myBoards({}, { actor: null } as never)
    ).toThrow(expect.objectContaining({ code: 'UNAUTHENTICATED' }));
  });
});
