import type { Context } from '../context.js';
import {
  requireBoardOwnerForResolver,
  requireCurrentUser,
} from './resolver-auth.js';

const user = {
  id: 'owner-1',
  authProvider: 'GOOGLE',
  providerUid: 'firebase-uid',
  email: 'owner@example.com',
  displayName: 'Owner',
  createdAt: new Date(),
  updatedAt: new Date(),
} as const;

function contextFor(currentUser: Context['currentUser']): Context {
  return { currentUser } as Context;
}

describe('resolver authorization', () => {
  it('prevents a guest from entering authenticated board mutations', () => {
    expect(() => requireCurrentUser(contextFor(null))).toThrow(
      expect.objectContaining({ extensions: { code: 'UNAUTHENTICATED' } })
    );
  });

  it('allows an authenticated user to enter board creation', () => {
    expect(requireCurrentUser(contextFor(user))).toBe(user);
  });

  it("prevents a user from modifying another owner's board", () => {
    const otherUser = { ...user, id: 'user-2' };

    expect(() =>
      requireBoardOwnerForResolver(
        { ownerId: 'owner-1' },
        contextFor(otherUser)
      )
    ).toThrow(expect.objectContaining({ extensions: { code: 'FORBIDDEN' } }));
  });

  it('allows the owner to enter board modification resolvers', () => {
    expect(
      requireBoardOwnerForResolver({ ownerId: 'owner-1' }, contextFor(user))
    ).toBe(user);
  });
});
