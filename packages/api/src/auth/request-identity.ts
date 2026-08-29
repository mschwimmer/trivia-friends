import { GraphQLError } from 'graphql';
import type { User } from '../generated/prisma/client.js';
import type { prisma } from '../lib/prisma.js';
import type { VerifiedFirebaseIdentity } from './firebase-admin.js';

async function verifyFirebaseIdToken(idToken: string) {
  const firebaseAdmin = await import('./firebase-admin.js');

  return firebaseAdmin.verifyFirebaseIdToken(idToken);
}

export type VerifyIdToken = (
  idToken: string
) => Promise<VerifiedFirebaseIdentity>;

export type ResolveRequestIdentityOptions = {
  authorizationHeader: string | undefined;
  prismaClient: typeof prisma;
  verifyIdToken?: VerifyIdToken;
};

export function unauthenticatedError(
  message = 'Authentication is required.'
): GraphQLError {
  return new GraphQLError(message, {
    extensions: { code: 'UNAUTHENTICATED' },
  });
}

export function parseBearerToken(
  authorizationHeader: string | undefined
): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const match = /^Bearer\s+(\S+)$/i.exec(authorizationHeader.trim());

  if (!match) {
    throw unauthenticatedError('The Authorization header is invalid.');
  }

  return match[1];
}

export async function resolveRequestIdentity({
  authorizationHeader,
  prismaClient,
  verifyIdToken = verifyFirebaseIdToken,
}: ResolveRequestIdentityOptions): Promise<User | null> {
  const idToken = parseBearerToken(authorizationHeader);

  if (!idToken) {
    return null;
  }

  let identity: VerifiedFirebaseIdentity;

  try {
    identity = await verifyIdToken(idToken);
  } catch {
    throw unauthenticatedError(
      'The authentication token is invalid or expired.'
    );
  }

  return prismaClient.user.upsert({
    where: {
      authProvider_providerUid: {
        authProvider: 'GOOGLE',
        providerUid: identity.uid,
      },
    },
    create: {
      authProvider: 'GOOGLE',
      providerUid: identity.uid,
      email: identity.email,
    },
    update: identity.email ? { email: identity.email } : {},
  });
}
