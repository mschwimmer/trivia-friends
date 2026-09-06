'use client';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import Link from 'next/link';

export const BOARD_PREVIEW_QUERY = gql`
  query BoardPreview($id: ID!) {
    board(id: $id) {
      id
      title
      description
      isPublic
      owner {
        displayName
      }
      categories {
        id
        colIndex
        title
        clues {
          id
          rowIndex
          value
        }
      }
    }
  }
`;

type PreviewBoard = {
  id: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  owner: { displayName: string | null };
  categories: {
    id: string;
    colIndex: number;
    title: string;
    clues: { id: string; rowIndex: number; value: number }[];
  }[];
};

type BoardPreviewData = { board: PreviewBoard | null };
type BoardPreviewVariables = { id: string };

export function BoardPreview({ boardId }: { boardId: string }) {
  const { data, loading, error, refetch } = useQuery<
    BoardPreviewData,
    BoardPreviewVariables
  >(BOARD_PREVIEW_QUERY, { variables: { id: boardId } });

  if (loading) {
    return (
      <div className="preview-state" role="status">
        <div className="preview-title-skeleton" />
        <div className="board-grid-skeleton" />
        <span className="sr-only">Loading board preview</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="preview-state board-list-state" role="alert">
        <strong>We couldn&apos;t load this board.</strong>
        <p>Check your connection and try again.</p>
        <button
          className="button button--secondary"
          type="button"
          onClick={() => refetch()}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data?.board) {
    return (
      <div className="preview-state board-list-state" role="status">
        <strong>Board not found</strong>
        <p>This board may be private, unpublished, or no longer available.</p>
        <Link className="button button--secondary" href="/">
          Browse public boards
        </Link>
      </div>
    );
  }

  const board = data.board;
  const categories = [...board.categories].sort(
    (left, right) => left.colIndex - right.colIndex
  );

  return (
    <>
      <header className="preview-header">
        <div>
          <p className="eyebrow">
            {board.isPublic ? 'Public board' : 'Your private board'}
          </p>
          <h1>{board.title}</h1>
          <p className="board-owner">
            Created by {board.owner.displayName ?? 'Anonymous creator'}
          </p>
          {board.description ? (
            <p className="lede">{board.description}</p>
          ) : null}
        </div>
        <div className="preview-callout">
          <strong>Ready to play?</strong>
          <p>Review the board, then gather your players.</p>
          <span className="button" aria-label="Game setup coming next">
            Game setup coming next
          </span>
        </div>
      </header>

      <section aria-labelledby="board-grid-heading">
        <div className="grid-intro">
          <div>
            <p className="eyebrow">Board preview</p>
            <h2 id="board-grid-heading">Categories &amp; values</h2>
          </div>
          <p>Clue prompts and answers are hidden in preview mode.</p>
        </div>

        {categories.length ? (
          <>
            {/* Keyboard focus lets smaller-screen users pan this overflow region. */}
            {/* eslint-disable jsx-a11y/no-noninteractive-tabindex */}
            <div
              className="board-grid-scroll"
              role="region"
              aria-label={`${board.title} board grid`}
              tabIndex={0}
            >
              <div
                className="jeopardy-grid"
                style={{
                  gridTemplateColumns: `repeat(${categories.length}, minmax(9rem, 1fr))`,
                }}
              >
                {categories.map((category) => (
                  <div className="preview-category" key={category.id}>
                    <h3>{category.title}</h3>
                    <div className="preview-clues">
                      {[...category.clues]
                        .sort((left, right) => left.rowIndex - right.rowIndex)
                        .map((clue) => (
                          <div className="preview-clue" key={clue.id}>
                            <span>${clue.value.toLocaleString()}</span>
                            <span className="sr-only"> clue</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* eslint-enable jsx-a11y/no-noninteractive-tabindex */}
          </>
        ) : (
          <div className="board-list-state" role="status">
            <strong>This board is still being built</strong>
            <p>It does not have any categories to preview yet.</p>
          </div>
        )}
      </section>
    </>
  );
}
