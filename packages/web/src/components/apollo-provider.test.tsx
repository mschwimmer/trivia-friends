import { render } from '@testing-library/react';
import { useApolloClient } from '@apollo/client/react';
import { useAuth } from './auth-provider';
import { ClearApolloStoreWhenUserChanges } from './apollo-provider';

jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useApolloClient: jest.fn(),
}));

jest.mock('./auth-provider', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/firebase', () => ({
  getFirebaseAuth: jest.fn(),
}));

const mockedUseApolloClient = jest.mocked(useApolloClient);
const mockedUseAuth = jest.mocked(useAuth);
const clearStore = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
  clearStore.mockClear();
  mockedUseApolloClient.mockReturnValue({ clearStore } as never);
  mockedUseAuth.mockReturnValue({ user: null } as never);
});

describe('ClearApolloStoreWhenUserChanges', () => {
  it('does not clear in-flight queries on initial mount', () => {
    render(<ClearApolloStoreWhenUserChanges />);

    expect(clearStore).not.toHaveBeenCalled();
  });

  it('clears cached user data after the authenticated user changes', () => {
    const { rerender } = render(<ClearApolloStoreWhenUserChanges />);

    mockedUseAuth.mockReturnValue({ user: { uid: 'firebase-user' } } as never);
    rerender(<ClearApolloStoreWhenUserChanges />);

    expect(clearStore).toHaveBeenCalledTimes(1);
  });
});
