import { render, screen } from '@testing-library/react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useAuth } from './auth-provider';
import { AccountPanel } from './account-panel';

jest.mock('@apollo/client/react', () => ({
  useMutation: jest.fn(),
  useQuery: jest.fn(),
}));

jest.mock('./auth-provider', () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = jest.mocked(useAuth);
const mockedUseQuery = jest.mocked(useQuery);
const mockedUseMutation = jest.mocked(useMutation);

beforeEach(() => {
  mockedUseMutation.mockReturnValue([
    jest.fn(),
    { loading: false, error: undefined },
  ] as never);
  mockedUseQuery.mockReturnValue({
    data: undefined,
    loading: false,
    error: undefined,
  } as never);
});

describe('AccountPanel', () => {
  it('shows authentication loading state', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: true,
      error: null,
      signInWithGoogle: jest.fn(),
      signOutUser: jest.fn(),
    });

    render(<AccountPanel />);

    expect(
      screen.getByText('Checking your sign-in status…')
    ).toBeInTheDocument();
  });

  it('offers Google sign-in to guests and displays auth errors', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: 'The popup was blocked.',
      signInWithGoogle: jest.fn(),
      signOutUser: jest.fn(),
    });

    render(<AccountPanel />);

    expect(
      screen.getByRole('button', { name: 'Sign in with Google' })
    ).toBeInTheDocument();
    expect(screen.getByText('The popup was blocked.')).toBeInTheDocument();
  });

  it('keeps the Firebase email separate from the local display name', () => {
    mockedUseAuth.mockReturnValue({
      user: { uid: 'firebase-user', email: 'player@example.com' } as never,
      loading: false,
      error: null,
      signInWithGoogle: jest.fn(),
      signOutUser: jest.fn(),
    });
    mockedUseQuery.mockReturnValue({
      data: { me: { id: 'user-1', displayName: 'Quizmaster' } },
      loading: false,
      error: undefined,
    } as never);

    render(<AccountPanel />);

    expect(screen.getByText('Quizmaster')).toBeInTheDocument();
    expect(screen.getByText('player@example.com')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Sign out' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Edit display name' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My boards' })).toHaveAttribute(
      'href',
      '/boards'
    );
  });
});
