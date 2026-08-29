import { GraphQLError } from 'graphql';
import {
  parseBearerToken,
  resolveRequestIdentity,
} from './request-identity.js';

function prismaClientWithUpsert(upsert = jest.fn()) {
  return {
    user: { upsert },
  } as never;
}

describe('request identity', () => {
  it('treats a request without an Authorization header as a guest', async () => {
    const verifyIdToken = jest.fn();
    const prismaClient = prismaClientWithUpsert();

    await expect(
      resolveRequestIdentity({
        authorizationHeader: undefined,
        prismaClient,
        verifyIdToken,
      })
    ).resolves.toBeNull();
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it('accepts a case-insensitive Bearer scheme', () => {
    expect(parseBearerToken('bearer firebase-token')).toBe('firebase-token');
  });

  it('rejects malformed and invalid credentials as unauthenticated', async () => {
    expect(() => parseBearerToken('Basic abc')).toThrow(GraphQLError);

    await expect(
      resolveRequestIdentity({
        authorizationHeader: 'Bearer expired-token',
        prismaClient: prismaClientWithUpsert(),
        verifyIdToken: jest.fn().mockRejectedValue(new Error('expired')),
      })
    ).rejects.toMatchObject({
      extensions: { code: 'UNAUTHENTICATED' },
    });
  });

  it('upserts the local Google user after verifying the Firebase token', async () => {
    const localUser = { id: 'user-1', displayName: 'Quizmaster' };
    const upsert = jest.fn().mockResolvedValue(localUser);

    await expect(
      resolveRequestIdentity({
        authorizationHeader: 'Bearer valid-token',
        prismaClient: prismaClientWithUpsert(upsert),
        verifyIdToken: jest.fn().mockResolvedValue({
          uid: 'firebase-uid',
          email: 'player@example.com',
        }),
      })
    ).resolves.toBe(localUser);

    expect(upsert).toHaveBeenCalledWith({
      where: {
        authProvider_providerUid: {
          authProvider: 'GOOGLE',
          providerUid: 'firebase-uid',
        },
      },
      create: {
        authProvider: 'GOOGLE',
        providerUid: 'firebase-uid',
        email: 'player@example.com',
      },
      update: { email: 'player@example.com' },
    });
  });
});
