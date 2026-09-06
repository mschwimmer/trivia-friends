import { fireEvent, render, screen } from '@testing-library/react';
import { useQuery } from '@apollo/client/react';
import { PublicBoardList } from './public-board-list';

jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: jest.fn(),
}));

const mockedUseQuery = jest.mocked(useQuery);
const refetch = jest.fn();

describe('PublicBoardList', () => {
  beforeEach(() => {
    refetch.mockClear();
  });

  it('renders a loading state', () => {
    mockedUseQuery.mockReturnValue({ loading: true } as never);

    render(<PublicBoardList />);

    expect(screen.getByLabelText('Loading public boards')).toBeInTheDocument();
  });

  it('renders an empty state', () => {
    mockedUseQuery.mockReturnValue({
      loading: false,
      data: { publicBoards: [] },
    } as never);

    render(<PublicBoardList />);

    expect(screen.getByText('No public boards yet')).toBeInTheDocument();
  });

  it('renders board details and a play action', () => {
    mockedUseQuery.mockReturnValue({
      loading: false,
      data: {
        publicBoards: [
          {
            id: 'board-1',
            title: 'Friday Night Facts',
            description: 'A little bit of everything.',
            owner: { displayName: 'Casey' },
            categories: [{ id: 'category-1' }, { id: 'category-2' }],
            clues: [{ id: 'clue-1' }],
          },
        ],
      },
    } as never);

    render(<PublicBoardList />);

    expect(
      screen.getByRole('heading', { name: 'Friday Night Facts' })
    ).toBeInTheDocument();
    expect(screen.getByText('By Casey')).toBeInTheDocument();
    expect(screen.getByText('2 categories')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Play this board' })
    ).toHaveAttribute('href', '/boards/board-1');
  });

  it('offers to retry after an error', () => {
    mockedUseQuery.mockReturnValue({
      loading: false,
      error: new Error('offline'),
      refetch,
    } as never);

    render(<PublicBoardList />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
