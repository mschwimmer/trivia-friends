'use client';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import Link from 'next/link';

export const PUBLIC_BOARDS_QUERY = gql`
  query PublicBoards($limit: Int!, $offset: Int!) {
    publicBoards(limit: $limit, offset: $offset) {
      id
      title
      description
      owner {
        displayName
      }
      categories {
        id
      }
      clues {
        id
      }
    }
  }
`;

type PublicBoard = {
  id: string;
  title: string;
  description: string | null;
  owner: { displayName: string | null };
  categories: { id: string }[];
  clues: { id: string }[];
};

type PublicBoardsData = { publicBoards: PublicBoard[] };

function BoardListState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="board-list-state" role="status">
      <span className="state-mark" aria-hidden="true">
        ✦
      </span>
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  );
}

export function PublicBoardList() {
  const { data, loading, error, refetch } = useQuery<PublicBoardsData>(
    PUBLIC_BOARDS_QUERY,
    { variables: { limit: 20, offset: 0 } }
  );

  if (loading) {
    return (
      <div className="board-card-grid" aria-label="Loading public boards">
        {[0, 1, 2].map((item) => (
          <div className="board-card board-card--skeleton" key={item} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="board-list-state" role="alert">
        <span className="state-mark" aria-hidden="true">
          !
        </span>
        <strong>We couldn&apos;t load the boards.</strong>
        <p>Check your connection, then give it another shot.</p>
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

  if (!data?.publicBoards.length) {
    return (
      <BoardListState
        title="No public boards yet"
        detail="The first public board will show up here when it is published."
      />
    );
  }

  return (
    <div className="board-card-grid">
      {data.publicBoards.map((board) => (
        <article className="board-card" key={board.id}>
          <div className="board-card-topline">
            <span>{board.categories.length} categories</span>
            <span>{board.clues.length} clues</span>
          </div>
          <div>
            <h3>{board.title}</h3>
            <p className="board-owner">
              By {board.owner.displayName ?? 'Anonymous creator'}
            </p>
            <p className="board-description">
              {board.description ??
                'A fresh set of clues ready for game night.'}
            </p>
          </div>
          <Link
            className="button board-card-action"
            href={`/boards/${board.id}`}
          >
            Play this board
          </Link>
        </article>
      ))}
    </div>
  );
}
