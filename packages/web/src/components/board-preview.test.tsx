import { render, screen } from '@testing-library/react';
import { useQuery } from '@apollo/client/react';
import { print } from 'graphql';
import { BOARD_PREVIEW_QUERY, BoardPreview } from './board-preview';

jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: jest.fn(),
}));

const mockedUseQuery = jest.mocked(useQuery);

describe('BoardPreview', () => {
  it('does not expose a missing or inaccessible board', () => {
    mockedUseQuery.mockReturnValue({
      loading: false,
      data: { board: null },
    } as never);

    render(<BoardPreview boardId="private-board" />);

    expect(screen.getByText('Board not found')).toBeInTheDocument();
    expect(
      screen.getByText(/may be private, unpublished, or no longer available/i)
    ).toBeInTheDocument();
  });

  it('shows ordered categories and values without question content', () => {
    mockedUseQuery.mockReturnValue({
      loading: false,
      data: {
        board: {
          id: 'board-1',
          title: 'Friday Night Facts',
          description: 'A little bit of everything.',
          isPublic: true,
          owner: { displayName: 'Casey' },
          categories: [
            {
              id: 'category-2',
              colIndex: 1,
              title: 'Science',
              clues: [{ id: 'clue-2', rowIndex: 0, value: 400 }],
            },
            {
              id: 'category-1',
              colIndex: 0,
              title: 'History',
              clues: [
                { id: 'clue-3', rowIndex: 1, value: 600 },
                { id: 'clue-1', rowIndex: 0, value: 200 },
              ],
            },
          ],
        },
      },
    } as never);

    const { container } = render(<BoardPreview boardId="board-1" />);

    expect(
      screen.getByRole('heading', { name: 'Friday Night Facts' })
    ).toBeInTheDocument();
    expect(screen.getByText('Created by Casey')).toBeInTheDocument();
    expect(screen.getByText('$200')).toBeInTheDocument();
    expect(screen.getByText('$600')).toBeInTheDocument();
    const previewOperation = print(BOARD_PREVIEW_QUERY);
    expect(previewOperation).not.toMatch(/\bquestion\b/);
    expect(previewOperation).not.toMatch(/\bprompt\b/);
    expect(previewOperation).not.toMatch(/\banswer\b/);

    const categoryHeadings = container.querySelectorAll('.preview-category h3');
    expect(categoryHeadings[0]).toHaveTextContent('History');
    expect(categoryHeadings[1]).toHaveTextContent('Science');
  });
});
