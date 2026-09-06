import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useMutation, useQuery } from '@apollo/client/react';
import { print } from 'graphql';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import { MyBoardsDashboard } from './my-boards-dashboard';

jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useMutation: jest.fn(),
  useQuery: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('./auth-provider', () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = jest.mocked(useAuth);
const mockedUseQuery = jest.mocked(useQuery);
const mockedUseMutation = jest.mocked(useMutation);
const mockedUseRouter = jest.mocked(useRouter);
const push = jest.fn();
const createBoard = jest.fn();
const deleteBoard = jest.fn();
const refetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseRouter.mockReturnValue({ push } as never);
  mockedUseAuth.mockReturnValue({
    user: { uid: 'firebase-user' } as never,
    loading: false,
    signInWithGoogle: jest.fn(),
  } as never);
  mockedUseQuery.mockReturnValue({
    loading: false,
    data: { myBoards: [] },
    refetch,
  } as never);
  mockedUseMutation.mockImplementation((mutation) => {
    const operation = print(mutation);
    return operation.includes('CreateBoard')
      ? ([createBoard, { loading: false }] as never)
      : ([deleteBoard, { loading: false }] as never);
  });
});

describe('MyBoardsDashboard', () => {
  it('asks guests to sign in', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signInWithGoogle: jest.fn(),
    } as never);

    render(<MyBoardsDashboard />);

    expect(
      screen.getByRole('heading', { name: 'Sign in to build a board.' })
    ).toBeInTheDocument();
  });

  it('creates a default board and opens its editor', async () => {
    createBoard.mockResolvedValue({
      data: { createBoard: { id: 'board-new', title: 'Movie Night' } },
    });
    render(<MyBoardsDashboard />);

    fireEvent.change(screen.getByLabelText('Board title'), {
      target: { value: 'Movie Night' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create 5×5 board' }));

    await waitFor(() =>
      expect(createBoard).toHaveBeenCalledWith({
        variables: {
          input: { title: 'Movie Night', isPublic: true },
        },
      })
    );
    expect(push).toHaveBeenCalledWith('/boards/board-new/edit');
  });

  it('shows owned boards and requires confirmation before deletion', () => {
    mockedUseQuery.mockReturnValue({
      loading: false,
      data: {
        myBoards: [
          {
            id: 'board-1',
            updatedAt: '2026-09-06',
            title: 'Movie Night',
            description: 'Only cinema clues.',
            isPublic: false,
            categories: [{ id: 'category-1' }],
            clues: [{ id: 'clue-1' }],
          },
        ],
      },
      refetch,
    } as never);
    jest.spyOn(window, 'confirm').mockReturnValue(false);

    render(<MyBoardsDashboard />);

    expect(screen.getByText('Private')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit board' })).toHaveAttribute(
      'href',
      '/boards/board-1/edit'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(window.confirm).toHaveBeenCalled();
    expect(deleteBoard).not.toHaveBeenCalled();
  });
});
