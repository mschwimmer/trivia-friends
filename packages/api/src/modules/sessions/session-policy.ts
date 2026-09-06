import type { GameSession } from '../../generated/prisma/client.js';
import { forbidden, notFound } from '../../application/errors.js';
import { guestHostTokenMatches } from '../../auth/guest-host-token.js';
import type { ServiceContext } from '../../application/service-context.js';

export function requireSessionHost(
  session: Pick<GameSession, 'hostUserId' | 'guestHostTokenHash'>,
  actorUserId: string | null,
  guestHostToken?: string | null
): void {
  if (session.hostUserId) {
    if (actorUserId !== session.hostUserId) {
      throw forbidden('Only the session host can control this game.');
    }

    return;
  }

  if (
    !guestHostToken ||
    !session.guestHostTokenHash ||
    !guestHostTokenMatches(guestHostToken, session.guestHostTokenHash)
  ) {
    throw forbidden('A valid guest host token is required.');
  }
}

export async function sessionOrThrow(
  { db }: ServiceContext,
  id: string
): Promise<GameSession> {
  const session = await db.gameSession.findUnique({ where: { id } });

  if (!session) {
    throw notFound('Game session');
  }

  return session;
}
