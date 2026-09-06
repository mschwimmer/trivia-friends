import { requireActor } from './authorization.js';

const user = {
  id: 'owner-1',
  authProvider: 'GOOGLE',
  providerUid: 'firebase-uid',
  email: 'owner@example.com',
  displayName: 'Owner',
  createdAt: new Date(),
  updatedAt: new Date(),
} as const;

describe('application actor authorization', () => {
  it('requires an authenticated actor', () => {
    expect(() => requireActor(null)).toThrow(
      expect.objectContaining({ code: 'UNAUTHENTICATED' })
    );
    expect(requireActor(user)).toBe(user);
  });
});
