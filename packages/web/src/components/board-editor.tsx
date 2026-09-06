'use client';

import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import Link from 'next/link';
import {
  type FormEvent,
  type ReactNode,
  useId,
  useMemo,
  useState,
} from 'react';
import { useAuth } from './auth-provider';

export const BOARD_EDITOR_QUERY = gql`
  query BoardEditor($id: ID!) {
    me {
      id
    }
    board(id: $id) {
      id
      ownerId
      updatedAt
      title
      description
      isPublic
      dailyDoubleClue {
        id
      }
      categories {
        id
        updatedAt
        colIndex
        title
        clues {
          id
          updatedAt
          colIndex
          rowIndex
          value
          question {
            id
            updatedAt
            prompt
            answer
          }
        }
      }
    }
  }
`;

const UPDATE_BOARD_MUTATION = gql`
  mutation UpdateBoard($id: ID!, $input: UpdateBoardInput!) {
    updateBoard(id: $id, input: $input) {
      id
      updatedAt
      title
      description
      isPublic
    }
  }
`;

const ADD_CATEGORY_MUTATION = gql`
  mutation AddBoardCategory($input: AddBoardCategoryInput!) {
    addBoardCategory(input: $input) {
      id
      updatedAt
      colIndex
      title
    }
  }
`;

const UPDATE_CATEGORY_MUTATION = gql`
  mutation UpdateBoardCategory($id: ID!, $input: UpdateBoardCategoryInput!) {
    updateBoardCategory(id: $id, input: $input) {
      id
      updatedAt
      colIndex
      title
    }
  }
`;

const REORDER_CATEGORIES_MUTATION = gql`
  mutation ReorderBoardCategories($boardId: ID!, $categoryIds: [ID!]!) {
    reorderBoardCategories(boardId: $boardId, categoryIds: $categoryIds) {
      id
      updatedAt
    }
  }
`;

const DELETE_CATEGORY_MUTATION = gql`
  mutation DeleteBoardCategory($id: ID!) {
    deleteBoardCategory(id: $id)
  }
`;

const ADD_CLUE_MUTATION = gql`
  mutation AddBoardClue($input: AddBoardClueInput!) {
    addBoardClue(input: $input) {
      id
      updatedAt
      colIndex
      rowIndex
      value
      question {
        id
        updatedAt
        prompt
        answer
      }
    }
  }
`;

const UPDATE_CLUE_MUTATION = gql`
  mutation UpdateBoardClue($id: ID!, $input: UpdateBoardClueInput!) {
    updateBoardClue(id: $id, input: $input) {
      id
      updatedAt
      colIndex
      rowIndex
      value
      question {
        id
        updatedAt
        prompt
        answer
      }
    }
  }
`;

const DELETE_CLUE_MUTATION = gql`
  mutation DeleteBoardClue($id: ID!) {
    deleteBoardClue(id: $id)
  }
`;

const SELECT_DAILY_DOUBLE_MUTATION = gql`
  mutation SelectDailyDouble($boardId: ID!, $clueId: ID!) {
    selectDailyDouble(boardId: $boardId, clueId: $clueId) {
      id
      updatedAt
      dailyDoubleClue {
        id
      }
    }
  }
`;

const MY_QUESTIONS_QUERY = gql`
  query EditorQuestions($search: String, $limit: Int!, $offset: Int!) {
    myQuestions(search: $search, limit: $limit, offset: $offset) {
      id
      prompt
      answer
    }
  }
`;

type EditorQuestion = {
  id: string;
  updatedAt: string;
  prompt: string;
  answer: string;
};

type EditorClue = {
  id: string;
  updatedAt: string;
  colIndex: number;
  rowIndex: number;
  value: number;
  question: EditorQuestion | null;
};

type EditorCategory = {
  id: string;
  updatedAt: string;
  colIndex: number;
  title: string;
  clues: EditorClue[];
};

type EditorBoard = {
  id: string;
  ownerId: string;
  updatedAt: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  dailyDoubleClue: { id: string } | null;
  categories: EditorCategory[];
};

type EditorData = {
  me: { id: string } | null;
  board: EditorBoard | null;
};
type EditorVariables = { id: string };

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
}

function SaveStatus({ dirty, saving }: { dirty: boolean; saving: boolean }) {
  return (
    <span
      className={`save-status ${dirty ? 'save-status--dirty' : ''}`}
      role="status"
    >
      {saving ? 'Saving…' : dirty ? 'Unsaved changes' : 'Saved'}
    </span>
  );
}

function FieldError({ children }: { children: ReactNode }) {
  return (
    <p className="field-error" role="alert">
      {children}
    </p>
  );
}

function BoardDetailsForm({
  board,
  onSaved,
}: {
  board: EditorBoard;
  onSaved: () => Promise<unknown>;
}) {
  const [title, setTitle] = useState(board.title);
  const [description, setDescription] = useState(board.description ?? '');
  const [isPublic, setIsPublic] = useState(board.isPublic);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [updateBoard, { loading, error }] = useMutation(UPDATE_BOARD_MUTATION);
  const dirty =
    title !== board.title ||
    description !== (board.description ?? '') ||
    isPublic !== board.isPublic;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedTitle = title.trim();
    if (!normalizedTitle || normalizedTitle.length > 100) {
      setValidationError('Title must be between 1 and 100 characters.');
      return;
    }
    if (description.trim().length > 500) {
      setValidationError('Description must be at most 500 characters.');
      return;
    }

    setValidationError(null);
    try {
      await updateBoard({
        variables: {
          id: board.id,
          input: {
            title: normalizedTitle,
            description,
            isPublic,
          },
        },
      });
      await onSaved();
    } catch {
      return;
    }
  }

  return (
    <form className="editor-panel board-details-form" onSubmit={submit}>
      <div className="editor-panel-heading">
        <div>
          <p className="eyebrow">Board settings</p>
          <h2>Details &amp; visibility</h2>
        </div>
        <SaveStatus dirty={dirty} saving={loading} />
      </div>

      <div className="editor-form-grid">
        <label>
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={100}
            required
          />
        </label>
        <label className="editor-description-field">
          Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={500}
            rows={3}
          />
        </label>
        <label className="checkbox-row editor-visibility">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(event) => setIsPublic(event.target.checked)}
          />
          Publicly discoverable
        </label>
      </div>
      {validationError ? <FieldError>{validationError}</FieldError> : null}
      {error ? <FieldError>{error.message}</FieldError> : null}
      <button className="button" type="submit" disabled={!dirty || loading}>
        Save details
      </button>
    </form>
  );
}

function QuestionLibrary({
  clueId,
  onSelect,
  onClose,
}: {
  clueId: string;
  onSelect: (questionId: string) => Promise<void>;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const { data, loading, error } = useQuery<{
    myQuestions: { id: string; prompt: string; answer: string }[];
  }>(MY_QUESTIONS_QUERY, {
    variables: { search: search.trim() || null, limit: 20, offset: 0 },
  });
  const searchId = `question-search-${clueId}`;

  return (
    <div className="question-library" aria-label="Reusable question library">
      <div className="question-library-heading">
        <strong>Reuse one of your questions</strong>
        <button className="text-button" type="button" onClick={onClose}>
          Close
        </button>
      </div>
      <label htmlFor={searchId}>Search prompts or answers</label>
      <input
        id={searchId}
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Start typing to filter…"
      />
      {loading ? <p className="account-loading">Searching…</p> : null}
      {error ? <FieldError>Could not load your questions.</FieldError> : null}
      {!loading && !error && !data?.myQuestions.length ? (
        <p className="account-loading">No matching questions.</p>
      ) : null}
      <div className="question-results">
        {data?.myQuestions.map((question) => (
          <button
            className="question-result"
            type="button"
            key={question.id}
            disabled={selectingId !== null}
            onClick={async () => {
              setSelectingId(question.id);
              setSelectionError(null);
              try {
                await onSelect(question.id);
                onClose();
              } catch (questionError) {
                setSelectionError(errorMessage(questionError));
              } finally {
                setSelectingId(null);
              }
            }}
          >
            <strong>{question.prompt || 'Empty prompt'}</strong>
            <span>{question.answer || 'Empty answer'}</span>
            <small>
              {selectingId === question.id ? 'Selecting…' : 'Use question'}
            </small>
          </button>
        ))}
      </div>
      {selectionError ? <FieldError>{selectionError}</FieldError> : null}
    </div>
  );
}

function ClueEditor({
  clue,
  isDailyDouble,
  onSaved,
  onSelectDailyDouble,
}: {
  clue: EditorClue;
  isDailyDouble: boolean;
  onSaved: () => Promise<unknown>;
  onSelectDailyDouble: (clueId: string) => Promise<void>;
}) {
  const promptId = useId();
  const answerId = useId();
  const valueId = useId();
  const [prompt, setPrompt] = useState(clue.question?.prompt ?? '');
  const [answer, setAnswer] = useState(clue.question?.answer ?? '');
  const [value, setValue] = useState(String(clue.value));
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [updateClue, { loading, error }] = useMutation(UPDATE_CLUE_MUTATION);
  const [deleteClue, { loading: deleting, error: deleteError }] =
    useMutation(DELETE_CLUE_MUTATION);
  const dirty =
    prompt !== (clue.question?.prompt ?? '') ||
    answer !== (clue.question?.answer ?? '') ||
    value !== String(clue.value);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericValue = Number(value);
    if (!prompt.trim() || prompt.trim().length > 2000) {
      setValidationError('Prompt must be between 1 and 2,000 characters.');
      return;
    }
    if (!answer.trim() || answer.trim().length > 1000) {
      setValidationError('Answer must be between 1 and 1,000 characters.');
      return;
    }
    if (!Number.isInteger(numericValue) || numericValue < 1) {
      setValidationError('Value must be a positive whole number.');
      return;
    }

    setValidationError(null);
    try {
      await updateClue({
        variables: {
          id: clue.id,
          input: {
            value: numericValue,
            question: { prompt: prompt.trim(), answer: answer.trim() },
          },
        },
      });
      await onSaved();
    } catch {
      return;
    }
  }

  async function removeClue() {
    if (!window.confirm(`Delete the $${clue.value} clue?`)) return;
    try {
      await deleteClue({ variables: { id: clue.id } });
      await onSaved();
    } catch {
      return;
    }
  }

  async function reuseQuestion(questionId: string) {
    await updateClue({
      variables: {
        id: clue.id,
        input: { question: { questionId } },
      },
    });
    await onSaved();
  }

  return (
    <article
      className={`clue-editor ${isDailyDouble ? 'clue-editor--daily-double' : ''}`}
    >
      <form onSubmit={submit}>
        <div className="clue-editor-heading">
          <strong>Clue {clue.rowIndex + 1}</strong>
          <SaveStatus dirty={dirty} saving={loading} />
        </div>
        <label htmlFor={valueId}>Point value</label>
        <input
          id={valueId}
          type="number"
          min={1}
          step={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          required
        />
        <label htmlFor={promptId}>Prompt</label>
        <textarea
          id={promptId}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          maxLength={2000}
          rows={4}
          required
        />
        <label htmlFor={answerId}>Answer</label>
        <textarea
          id={answerId}
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          maxLength={1000}
          rows={2}
          required
        />
        {validationError ? <FieldError>{validationError}</FieldError> : null}
        {error ? <FieldError>{error.message}</FieldError> : null}
        {deleteError ? <FieldError>{deleteError.message}</FieldError> : null}
        <div className="clue-actions">
          <button className="button" type="submit" disabled={!dirty || loading}>
            Save clue
          </button>
          <button
            className="button button--secondary"
            type="button"
            onClick={() => setShowLibrary((current) => !current)}
          >
            Reuse question
          </button>
          <button
            className={`button button--secondary daily-double-button ${
              isDailyDouble ? 'daily-double-button--selected' : ''
            }`}
            type="button"
            aria-pressed={isDailyDouble}
            onClick={() => onSelectDailyDouble(clue.id)}
          >
            {isDailyDouble ? 'Daily Double ✓' : 'Make Daily Double'}
          </button>
          <button
            className="text-button text-button--danger"
            type="button"
            disabled={deleting}
            onClick={removeClue}
          >
            {deleting ? 'Deleting…' : 'Delete clue'}
          </button>
        </div>
      </form>
      {showLibrary ? (
        <QuestionLibrary
          clueId={clue.id}
          onSelect={reuseQuestion}
          onClose={() => setShowLibrary(false)}
        />
      ) : null}
    </article>
  );
}

function NewClueForm({
  boardId,
  category,
  onSaved,
}: {
  boardId: string;
  category: EditorCategory;
  onSaved: () => Promise<unknown>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [value, setValue] = useState(
    String(Math.max(0, ...category.clues.map((clue) => clue.value)) + 200)
  );
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [addClue, { loading, error }] = useMutation(ADD_CLUE_MUTATION);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericValue = Number(value);
    if (!prompt.trim() || !answer.trim()) {
      setValidationError('A new clue needs both a prompt and an answer.');
      return;
    }
    if (!Number.isInteger(numericValue) || numericValue < 1) {
      setValidationError('Value must be a positive whole number.');
      return;
    }

    setValidationError(null);
    try {
      await addClue({
        variables: {
          input: {
            boardId,
            colIndex: category.colIndex,
            rowIndex:
              Math.max(-1, ...category.clues.map((clue) => clue.rowIndex)) + 1,
            value: numericValue,
            question: { prompt: prompt.trim(), answer: answer.trim() },
          },
        },
      });
      await onSaved();
      setExpanded(false);
      setPrompt('');
      setAnswer('');
    } catch {
      return;
    }
  }

  if (!expanded) {
    return (
      <button
        className="add-clue-button"
        type="button"
        onClick={() => setExpanded(true)}
      >
        + Add clue row
      </button>
    );
  }

  return (
    <form className="new-clue-form" onSubmit={submit}>
      <strong>Add clue {category.clues.length + 1}</strong>
      <label>
        Point value
        <input
          type="number"
          min={1}
          step={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          required
        />
      </label>
      <label>
        Prompt
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          maxLength={2000}
          rows={3}
          required
        />
      </label>
      <label>
        Answer
        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          maxLength={1000}
          rows={2}
          required
        />
      </label>
      {validationError ? <FieldError>{validationError}</FieldError> : null}
      {error ? <FieldError>{error.message}</FieldError> : null}
      <div className="clue-actions">
        <button className="button" type="submit" disabled={loading}>
          {loading ? 'Adding…' : 'Add clue'}
        </button>
        <button
          className="button button--secondary"
          type="button"
          onClick={() => setExpanded(false)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function CategoryEditor({
  boardId,
  category,
  categoryNumber,
  canMoveLeft,
  canMoveRight,
  dailyDoubleClueId,
  onSaved,
  onMove,
  onSelectDailyDouble,
}: {
  boardId: string;
  category: EditorCategory;
  categoryNumber: number;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  dailyDoubleClueId: string | null;
  onSaved: () => Promise<unknown>;
  onMove: (direction: -1 | 1) => Promise<void>;
  onSelectDailyDouble: (clueId: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(category.title);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [updateCategory, { loading, error }] = useMutation(
    UPDATE_CATEGORY_MUTATION
  );
  const [deleteCategory, { loading: deleting, error: deleteCategoryError }] =
    useMutation(DELETE_CATEGORY_MUTATION);
  const clues = useMemo(
    () => [...category.clues].sort((a, b) => a.rowIndex - b.rowIndex),
    [category.clues]
  );
  const dirty = title !== category.title;

  async function saveTitle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedTitle = title.trim();
    if (!normalizedTitle || normalizedTitle.length > 100) {
      setValidationError(
        'Category title must be between 1 and 100 characters.'
      );
      return;
    }
    setValidationError(null);
    try {
      await updateCategory({
        variables: { id: category.id, input: { title: normalizedTitle } },
      });
      await onSaved();
    } catch {
      return;
    }
  }

  async function removeCategory() {
    if (
      !window.confirm(
        `Delete “${category.title || `Category ${categoryNumber}`}” and all of its clues?`
      )
    ) {
      return;
    }
    try {
      await deleteCategory({ variables: { id: category.id } });
      await onSaved();
    } catch {
      return;
    }
  }

  return (
    <section className="category-editor">
      <form className="category-title-form" onSubmit={saveTitle}>
        <div className="category-position">
          <span>Category {categoryNumber}</span>
          <div>
            <button
              type="button"
              aria-label={`Move ${category.title || `category ${categoryNumber}`} left`}
              disabled={!canMoveLeft}
              onClick={() => onMove(-1)}
            >
              ←
            </button>
            <button
              type="button"
              aria-label={`Move ${category.title || `category ${categoryNumber}`} right`}
              disabled={!canMoveRight}
              onClick={() => onMove(1)}
            >
              →
            </button>
          </div>
        </div>
        <label>
          Category title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={100}
            required
          />
        </label>
        <div className="category-title-actions">
          <SaveStatus dirty={dirty} saving={loading} />
          <button className="button" type="submit" disabled={!dirty || loading}>
            Save title
          </button>
        </div>
        {validationError ? <FieldError>{validationError}</FieldError> : null}
        {error ? <FieldError>{error.message}</FieldError> : null}
        {deleteCategoryError ? (
          <FieldError>{deleteCategoryError.message}</FieldError>
        ) : null}
      </form>

      <div className="category-clues">
        {clues.map((clue) => (
          <ClueEditor
            key={`${clue.id}:${clue.updatedAt}:${clue.question?.updatedAt ?? 'none'}`}
            clue={clue}
            isDailyDouble={dailyDoubleClueId === clue.id}
            onSaved={onSaved}
            onSelectDailyDouble={onSelectDailyDouble}
          />
        ))}
        <NewClueForm
          key={`new:${category.id}:${category.clues.length}`}
          boardId={boardId}
          category={category}
          onSaved={onSaved}
        />
      </div>

      <button
        className="text-button text-button--danger remove-category-button"
        type="button"
        disabled={deleting}
        onClick={removeCategory}
      >
        {deleting ? 'Deleting category…' : 'Delete category'}
      </button>
    </section>
  );
}

function NewCategoryForm({
  board,
  onSaved,
}: {
  board: EditorBoard;
  onSaved: () => Promise<unknown>;
}) {
  const [title, setTitle] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [addCategory, { loading, error }] = useMutation(ADD_CATEGORY_MUTATION);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedTitle = title.trim();
    if (!normalizedTitle || normalizedTitle.length > 100) {
      setValidationError(
        'Category title must be between 1 and 100 characters.'
      );
      return;
    }
    setValidationError(null);
    try {
      await addCategory({
        variables: {
          input: {
            boardId: board.id,
            title: normalizedTitle,
            colIndex:
              Math.max(
                -1,
                ...board.categories.map(({ colIndex }) => colIndex)
              ) + 1,
          },
        },
      });
      setTitle('');
      await onSaved();
    } catch {
      return;
    }
  }

  return (
    <form className="new-category-form" onSubmit={submit}>
      <div>
        <p className="eyebrow">Expand the board</p>
        <strong>Add another category</strong>
      </div>
      <label>
        Category title
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={100}
          required
        />
      </label>
      <button className="button" type="submit" disabled={loading}>
        {loading ? 'Adding…' : 'Add category'}
      </button>
      {validationError ? <FieldError>{validationError}</FieldError> : null}
      {error ? <FieldError>{error.message}</FieldError> : null}
    </form>
  );
}

export function BoardEditor({ boardId }: { boardId: string }) {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const { data, loading, error, refetch } = useQuery<
    EditorData,
    EditorVariables
  >(BOARD_EDITOR_QUERY, {
    variables: { id: boardId },
    skip: authLoading || !user,
  });
  const [reorderCategories, { loading: reordering, error: reorderError }] =
    useMutation(REORDER_CATEGORIES_MUTATION);
  const [
    selectDailyDouble,
    { loading: selectingDailyDouble, error: dailyDoubleError },
  ] = useMutation(SELECT_DAILY_DOUBLE_MUTATION);

  if (authLoading) {
    return <p className="account-loading editor-loading">Checking access…</p>;
  }

  if (!user) {
    return (
      <section className="dashboard-gate">
        <p className="eyebrow">Creator access</p>
        <h1>Sign in to edit this board.</h1>
        <button className="button" type="button" onClick={signInWithGoogle}>
          Sign in with Google
        </button>
      </section>
    );
  }

  if (loading) {
    return <p className="account-loading editor-loading">Loading editor…</p>;
  }

  if (error) {
    return (
      <div className="board-list-state editor-loading" role="alert">
        <strong>We couldn&apos;t load the editor.</strong>
        <p>{errorMessage(error)}</p>
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

  if (!data?.board || data.board.ownerId !== data.me?.id) {
    return (
      <div className="board-list-state editor-loading" role="status">
        <strong>Board unavailable</strong>
        <p>Only the board owner can open this editor.</p>
        <Link className="button button--secondary" href="/boards">
          Back to my boards
        </Link>
      </div>
    );
  }

  const board = data.board;
  const categories = [...board.categories].sort(
    (left, right) => left.colIndex - right.colIndex
  );

  async function saved() {
    return refetch();
  }

  async function moveCategory(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= categories.length) return;
    const ids = categories.map(({ id }) => id);
    [ids[index], ids[destination]] = [ids[destination], ids[index]];
    try {
      await reorderCategories({
        variables: { boardId: board.id, categoryIds: ids },
      });
      await refetch();
    } catch {
      return;
    }
  }

  async function chooseDailyDouble(clueId: string) {
    try {
      await selectDailyDouble({ variables: { boardId: board.id, clueId } });
      await refetch();
    } catch {
      return;
    }
  }

  return (
    <>
      <header className="editor-header">
        <div>
          <p className="eyebrow">Board editor</p>
          <h1>{board.title}</h1>
          <p className="lede">
            Build each category, complete every clue, and mark exactly one Daily
            Double before starting a game.
          </p>
        </div>
        <div className="editor-header-actions">
          <Link
            className="button button--secondary"
            href={`/boards/${board.id}`}
          >
            Preview board
          </Link>
          <Link className="text-button" href="/boards">
            Back to my boards
          </Link>
        </div>
      </header>

      <BoardDetailsForm
        key={`${board.id}:${board.updatedAt}`}
        board={board}
        onSaved={saved}
      />

      <section className="grid-editor" aria-labelledby="grid-editor-heading">
        <div className="grid-intro">
          <div>
            <p className="eyebrow">Grid editor</p>
            <h2 id="grid-editor-heading">Categories &amp; clues</h2>
          </div>
          <p>
            {board.dailyDoubleClue
              ? 'Daily Double selected. You can move it to any other clue.'
              : 'Choose one clue as the Daily Double to make this board playable.'}
          </p>
        </div>
        {reordering ? <p className="save-status">Reordering…</p> : null}
        {selectingDailyDouble ? (
          <p className="save-status">Saving Daily Double…</p>
        ) : null}
        {reorderError ? <FieldError>{reorderError.message}</FieldError> : null}
        {dailyDoubleError ? (
          <FieldError>{dailyDoubleError.message}</FieldError>
        ) : null}

        <div className="category-editor-scroll">
          <div className="category-editor-grid">
            {categories.map((category, index) => (
              <CategoryEditor
                key={`${category.id}:${category.updatedAt}`}
                boardId={board.id}
                category={category}
                categoryNumber={index + 1}
                canMoveLeft={index > 0 && !reordering}
                canMoveRight={index < categories.length - 1 && !reordering}
                dailyDoubleClueId={board.dailyDoubleClue?.id ?? null}
                onSaved={saved}
                onMove={(direction) => moveCategory(index, direction)}
                onSelectDailyDouble={chooseDailyDouble}
              />
            ))}
          </div>
        </div>

        <NewCategoryForm board={board} onSaved={saved} />
      </section>
    </>
  );
}
