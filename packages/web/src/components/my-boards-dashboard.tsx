'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { useAuth } from './auth-provider';

export const MY_BOARDS_QUERY = gql`
  query MyBoards($limit: Int!, $offset: Int!) {
    myBoards(limit: $limit, offset: $offset) {
      id
      updatedAt
      title
      description
      isPublic
      categories {
        id
      }
      clues {
        id
      }
    }
  }
`;

const CREATE_BOARD_MUTATION = gql`
  mutation CreateBoard($input: CreateBoardInput!) {
    createBoard(input: $input) {
      id
      title
    }
  }
`;

const DELETE_BOARD_MUTATION = gql`
  mutation DeleteBoard($id: ID!) {
    deleteBoard(id: $id)
  }
`;

type MyBoard = {
  id: string;
  updatedAt: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  categories: { id: string }[];
  clues: { id: string }[];
};

type MyBoardsData = { myBoards: MyBoard[] };
type CreateBoardData = { createBoard: { id: string; title: string } };

function friendlyError(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
}

export function MyBoardsDashboard() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const { data, loading, error, refetch } = useQuery<MyBoardsData>(
    MY_BOARDS_QUERY,
    {
      variables: { limit: 50, offset: 0 },
      skip: !user,
    }
  );
  const [createBoard, { loading: creating }] = useMutation<CreateBoardData>(
    CREATE_BOARD_MUTATION
  );
  const [deleteBoard] = useMutation(DELETE_BOARD_MUTATION);
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function submitBoard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedTitle = title.trim();

    if (!normalizedTitle || normalizedTitle.length > 100) {
      setFormError('Board title must be between 1 and 100 characters.');
      return;
    }

    setFormError(null);
    try {
      const result = await createBoard({
        variables: { input: { title: normalizedTitle, isPublic } },
      });
      const boardId = result.data?.createBoard.id;
      if (boardId) router.push(`/boards/${boardId}/edit`);
    } catch (mutationError) {
      setFormError(friendlyError(mutationError));
    }
  }

  async function confirmDelete(board: MyBoard) {
    if (
      !window.confirm(
        `Delete “${board.title}”? This permanently removes the board and cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(board.id);
    setFormError(null);
    try {
      await deleteBoard({ variables: { id: board.id } });
      await refetch();
    } catch (mutationError) {
      setFormError(friendlyError(mutationError));
    } finally {
      setDeletingId(null);
    }
  }

  if (authLoading) {
    return <p className="account-loading">Checking your sign-in status…</p>;
  }

  if (!user) {
    return (
      <section className="dashboard-gate">
        <p className="eyebrow">Creator access</p>
        <h1>Sign in to build a board.</h1>
        <p className="lede">
          Board creation is tied to your account so only you can edit or delete
          your work.
        </p>
        <button className="button" type="button" onClick={signInWithGoogle}>
          Sign in with Google
        </button>
      </section>
    );
  }

  return (
    <>
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Your workshop</p>
          <h1>My boards</h1>
          <p className="lede">
            Draft the clues, choose a Daily Double, then make it public when it
            is ready for game night.
          </p>
        </div>
        <form className="create-board-card" onSubmit={submitBoard}>
          <h2>Create a board</h2>
          <label htmlFor="new-board-title">Board title</label>
          <input
            id="new-board-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={100}
            required
          />
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(event) => setIsPublic(event.target.checked)}
            />
            Publicly discoverable
          </label>
          <button className="button" type="submit" disabled={creating}>
            {creating ? 'Creating…' : 'Create 5×5 board'}
          </button>
          {formError ? (
            <p className="form-error" role="alert">
              {formError}
            </p>
          ) : null}
        </form>
      </header>

      <section className="owned-boards" aria-labelledby="owned-boards-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Library</p>
            <h2 id="owned-boards-heading">Boards you own</h2>
          </div>
        </div>

        {loading ? (
          <div className="board-card-grid" aria-label="Loading your boards">
            {[0, 1].map((item) => (
              <div className="board-card board-card--skeleton" key={item} />
            ))}
          </div>
        ) : error ? (
          <div className="board-list-state" role="alert">
            <strong>We couldn&apos;t load your boards.</strong>
            <button
              className="button button--secondary"
              type="button"
              onClick={() => refetch()}
            >
              Try again
            </button>
          </div>
        ) : !data?.myBoards.length ? (
          <div className="board-list-state" role="status">
            <strong>Your board shelf is empty</strong>
            <p>Create a board above to start with a ready-made 5×5 grid.</p>
          </div>
        ) : (
          <div className="owned-board-list">
            {data.myBoards.map((board) => (
              <article className="owned-board-row" key={board.id}>
                <div>
                  <div className="owned-board-meta">
                    <span>{board.isPublic ? 'Public' : 'Private'}</span>
                    <span>{board.categories.length} categories</span>
                    <span>{board.clues.length} clues</span>
                  </div>
                  <h3>{board.title}</h3>
                  {board.description ? <p>{board.description}</p> : null}
                </div>
                <div className="owned-board-actions">
                  <Link className="button" href={`/boards/${board.id}/edit`}>
                    Edit board
                  </Link>
                  <Link
                    className="button button--secondary"
                    href={`/boards/${board.id}`}
                  >
                    Preview
                  </Link>
                  <button
                    className="text-button text-button--danger"
                    type="button"
                    disabled={deletingId === board.id}
                    onClick={() => confirmDelete(board)}
                  >
                    {deletingId === board.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
