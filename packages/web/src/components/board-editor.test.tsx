import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useMutation, useQuery } from '@apollo/client/react';
import { print } from 'graphql';
import { useAuth } from './auth-provider';
import { BoardEditor } from './board-editor';

jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useMutation: jest.fn(),
  useQuery: jest.fn(),
}));

jest.mock('./auth-provider', () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = jest.mocked(useAuth);
const mockedUseQuery = jest.mocked(useQuery);
const mockedUseMutation = jest.mocked(useMutation);
const updateClue = jest.fn();
const selectDailyDouble = jest.fn();
const refetch = jest.fn().mockResolvedValue({});

const board = {
  id: 'board-1',
  ownerId: 'user-1',
  updatedAt: '2026-09-06T12:00:00Z',
  title: 'Friday Night Facts',
  description: 'A little bit of everything.',
  isPublic: true,
  dailyDoubleClue: { id: 'clue-1' },
  categories: [
    {
      id: 'category-1',
      updatedAt: '2026-09-06T12:00:00Z',
      colIndex: 0,
      title: 'History',
      clues: [
        {
          id: 'clue-1',
          updatedAt: '2026-09-06T12:00:00Z',
          colIndex: 0,
          rowIndex: 0,
          value: 200,
          question: {
            id: 'question-1',
            updatedAt: '2026-09-06T12:00:00Z',
            prompt: 'This city hosted the first modern Olympics.',
            answer: 'Athens',
          },
        },
      ],
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  refetch.mockResolvedValue({});
  mockedUseAuth.mockReturnValue({
    user: { uid: 'firebase-user' } as never,
    loading: false,
    signInWithGoogle: jest.fn(),
  } as never);
  mockedUseQuery.mockImplementation((query) => {
    const operation = print(query);
    if (operation.includes('EditorQuestions')) {
      return {
        loading: false,
        data: {
          myQuestions: [
            {
              id: 'question-reused',
              prompt: 'A reusable prompt',
              answer: 'A reusable answer',
            },
          ],
        },
      } as never;
    }
    return {
      loading: false,
      data: { me: { id: 'user-1' }, board },
      refetch,
    } as never;
  });
  mockedUseMutation.mockImplementation((mutation) => {
    const operation = print(mutation);
    if (operation.includes('UpdateBoardClue')) {
      return [updateClue, { loading: false }] as never;
    }
    if (operation.includes('SelectDailyDouble')) {
      return [selectDailyDouble, { loading: false }] as never;
    }
    return [jest.fn(), { loading: false }] as never;
  });
});

describe('BoardEditor', () => {
  it('renders editable clue content and one selected Daily Double', () => {
    render(<BoardEditor boardId="board-1" />);

    expect(
      screen.getByRole('heading', { name: 'Friday Night Facts' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Prompt')).toHaveValue(
      'This city hosted the first modern Olympics.'
    );
    expect(screen.getByLabelText('Answer')).toHaveValue('Athens');
    expect(
      screen.getByRole('button', { name: 'Daily Double ✓' })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('marks changed clue content as unsaved and saves it', async () => {
    updateClue.mockResolvedValue({ data: {} });
    render(<BoardEditor boardId="board-1" />);

    fireEvent.change(screen.getByLabelText('Answer'), {
      target: { value: '  Athens, Greece  ' },
    });

    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save clue' }));

    await waitFor(() =>
      expect(updateClue).toHaveBeenCalledWith({
        variables: {
          id: 'clue-1',
          input: {
            value: 200,
            question: {
              prompt: 'This city hosted the first modern Olympics.',
              answer: 'Athens, Greece',
            },
          },
        },
      })
    );
    expect(refetch).toHaveBeenCalled();
  });

  it('searches and reuses an owned question', async () => {
    updateClue.mockResolvedValue({ data: {} });
    render(<BoardEditor boardId="board-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Reuse question' }));
    expect(
      screen.getByLabelText('Search prompts or answers')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /A reusable prompt/i }));

    await waitFor(() =>
      expect(updateClue).toHaveBeenCalledWith({
        variables: {
          id: 'clue-1',
          input: { question: { questionId: 'question-reused' } },
        },
      })
    );
  });

  it('protects the editor from signed-out users', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      loading: false,
      signInWithGoogle: jest.fn(),
    } as never);

    render(<BoardEditor boardId="board-1" />);

    expect(
      screen.getByRole('heading', { name: 'Sign in to edit this board.' })
    ).toBeInTheDocument();
  });

  it('does not render editing controls for another owner public board', () => {
    mockedUseQuery.mockReturnValue({
      loading: false,
      data: { me: { id: 'other-user' }, board },
      refetch,
    } as never);

    render(<BoardEditor boardId="board-1" />);

    expect(screen.getByText('Board unavailable')).toBeInTheDocument();
    expect(screen.queryByLabelText('Prompt')).not.toBeInTheDocument();
  });
});
