import { hashGuestHostToken } from '../../auth/guest-host-token.js';
import { requireSessionHost } from './session-policy.js';

describe('session host policy', () => {
  beforeAll(() => {
    process.env.GUEST_TOKEN_PEPPER = 'test-only-pepper';
  });

  it('allows only the signed-in session host', () => {
    const session = { hostUserId: 'owner-1', guestHostTokenHash: null };

    expect(() => requireSessionHost(session, 'owner-1')).not.toThrow();
    expect(() => requireSessionHost(session, 'other')).toThrow(
      expect.objectContaining({ code: 'FORBIDDEN' })
    );
  });

  it('accepts only the matching guest host token', () => {
    const session = {
      hostUserId: null,
      guestHostTokenHash: hashGuestHostToken('guest-secret'),
    };

    expect(() =>
      requireSessionHost(session, null, 'guest-secret')
    ).not.toThrow();
    expect(() => requireSessionHost(session, null, 'wrong')).toThrow(
      expect.objectContaining({ code: 'FORBIDDEN' })
    );
  });
});
