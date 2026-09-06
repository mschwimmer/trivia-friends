import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

function tokenPepper(): string {
  const pepper = process.env.GUEST_TOKEN_PEPPER;

  if (!pepper) {
    throw new Error('GUEST_TOKEN_PEPPER is required for guest-host sessions.');
  }

  return pepper;
}

export function createGuestHostToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashGuestHostToken(token) };
}

export function hashGuestHostToken(token: string): string {
  return createHash('sha256').update(tokenPepper()).update(token).digest('hex');
}

export function guestHostTokenMatches(token: string, expectedHash: string) {
  const actual = Buffer.from(hashGuestHostToken(token), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
