import { ApolloServer } from '@apollo/server';
import { readFileSync } from 'node:fs';
import type { Context } from './context.js';
import { resolvers } from './resolvers/index.js';

const typeDefs = readFileSync(
  new URL('./schema.graphql', `file://${__filename}`),
  'utf8'
);

const currentUser = {
  id: 'user-1',
  authProvider: 'GOOGLE',
  providerUid: 'firebase-uid',
  email: 'player@example.com',
  displayName: null,
  createdAt: new Date(),
  updatedAt: new Date(),
} as const;

describe('profile resolvers', () => {
  it('returns the authenticated local user from me', () => {
    expect(
      resolvers.Query.me(undefined, undefined, {
        currentUser,
      } as Context)
    ).toBe(currentUser);
  });

  it('rejects guest display-name updates', async () => {
    await expect(
      resolvers.Mutation.updateDisplayName(
        undefined,
        { displayName: 'Quizmaster' },
        { currentUser: null } as Context
      )
    ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });

  it('normalizes and saves a separate local display name', async () => {
    const updatedUser = { ...currentUser, displayName: 'Quizmaster' };
    const update = jest.fn().mockResolvedValue(updatedUser);

    await expect(
      resolvers.Mutation.updateDisplayName(
        undefined,
        { displayName: '  Quizmaster  ' },
        {
          currentUser,
          prisma: { user: { update } },
        } as never
      )
    ).resolves.toBe(updatedUser);

    expect(update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { displayName: 'Quizmaster' },
    });
  });

  it('rejects blank or overly long display names', async () => {
    for (const displayName of ['   ', 'x'.repeat(51)]) {
      await expect(
        resolvers.Mutation.updateDisplayName(undefined, { displayName }, {
          currentUser,
        } as Context)
      ).rejects.toMatchObject({ code: 'BAD_USER_INPUT' });
    }
  });
});

describe('executable GraphQL schema', () => {
  it('starts with every resolver attached to a declared field', async () => {
    const server = new ApolloServer({ typeDefs, resolvers });

    await expect(server.start()).resolves.toBeUndefined();
    await expect(server.stop()).resolves.toBeUndefined();
  });
});
