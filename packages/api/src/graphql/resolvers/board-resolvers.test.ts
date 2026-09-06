import { boardResolvers } from './board-resolvers.js';

describe('board GraphQL resolvers', () => {
  it('does not expose board question content to non-owners', async () => {
    const findUniqueOrThrow = jest
      .fn()
      .mockResolvedValue({ ownerId: 'owner-1' });
    const context = {
      currentUser: null,
      prisma: {
        board: { findUniqueOrThrow },
        question: { findUnique: jest.fn() },
      },
    } as never;

    await expect(
      boardResolvers.BoardClue.question(
        { boardId: 'board-1', questionId: 'question-1' } as never,
        undefined,
        context
      )
    ).resolves.toBeNull();
  });
});
