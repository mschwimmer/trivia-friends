import {
  BoardAccessError,
  BoardNotPlayableError,
  canEditBoard,
  canViewBoard,
  getBoardPlayabilityIssues,
  requireBoardOwner,
  requirePlayableBoard,
  requireQuestionCreator,
  requireQuestionReuseAccess,
} from './board-policy.js';

describe('board access policy', () => {
  const publicBoard = { ownerId: 'owner-1', isPublic: true };
  const privateBoard = { ownerId: 'owner-1', isPublic: false };

  it('allows anyone to view a public board', () => {
    expect(canViewBoard(publicBoard, null)).toBe(true);
    expect(canViewBoard(publicBoard, 'user-2')).toBe(true);
  });

  it('allows only the owner to view a private board', () => {
    expect(canViewBoard(privateBoard, 'owner-1')).toBe(true);
    expect(canViewBoard(privateBoard, null)).toBe(false);
    expect(canViewBoard(privateBoard, 'user-2')).toBe(false);
  });

  it('allows only an authenticated owner to modify a board', () => {
    expect(canEditBoard(publicBoard, 'owner-1')).toBe(true);
    expect(canEditBoard(publicBoard, null)).toBe(false);
    expect(canEditBoard(publicBoard, 'user-2')).toBe(false);
    expect(() => requireBoardOwner(publicBoard, 'user-2')).toThrow(
      BoardAccessError
    );
  });

  it('allows only the creator to modify a question', () => {
    expect(() =>
      requireQuestionCreator({ creatorId: 'owner-1' }, 'owner-1')
    ).not.toThrow();
    expect(() =>
      requireQuestionCreator({ creatorId: 'owner-1' }, 'user-2')
    ).toThrow(BoardAccessError);
  });

  it('allows only the creator to reuse a question', () => {
    expect(() =>
      requireQuestionReuseAccess({ creatorId: 'owner-1' }, 'owner-1')
    ).not.toThrow();
    expect(() =>
      requireQuestionReuseAccess({ creatorId: 'owner-1' }, 'user-2')
    ).toThrow(BoardAccessError);
  });
});

describe('board playability policy', () => {
  const playableBoard = {
    dailyDoubleClueId: 'clue-1',
    categories: [{ colIndex: 0 }],
    clues: [{ id: 'clue-1', colIndex: 0, rowIndex: 0 }],
  };

  it('accepts a board with a category, clue, and one selected Daily Double', () => {
    expect(getBoardPlayabilityIssues(playableBoard)).toEqual([]);
    expect(() => requirePlayableBoard(playableBoard)).not.toThrow();
  });

  it('rejects empty boards without a Daily Double', () => {
    expect(
      getBoardPlayabilityIssues({
        dailyDoubleClueId: null,
        categories: [],
        clues: [],
      })
    ).toEqual([
      'BOARD_HAS_NO_CATEGORIES',
      'BOARD_HAS_NO_CLUES',
      'DAILY_DOUBLE_NOT_SELECTED',
    ]);
  });

  it('rejects clues outside the category grid', () => {
    expect(
      getBoardPlayabilityIssues({
        ...playableBoard,
        clues: [{ id: 'clue-1', colIndex: 1, rowIndex: 0 }],
      })
    ).toContain('CLUE_HAS_NO_CATEGORY');
  });

  it('rejects a Daily Double pointer to a clue on another board', () => {
    const board = { ...playableBoard, dailyDoubleClueId: 'other-clue' };

    expect(getBoardPlayabilityIssues(board)).toContain(
      'DAILY_DOUBLE_NOT_ON_BOARD'
    );
    expect(() => requirePlayableBoard(board)).toThrow(BoardNotPlayableError);
  });
});
