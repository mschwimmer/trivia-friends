export type BoardAccess = {
  ownerId: string;
  isPublic: boolean;
};

export type BoardCategoryPosition = {
  colIndex: number;
};

export type BoardCluePosition = {
  id: string;
  colIndex: number;
  rowIndex: number;
};

export type BoardForPlayability = {
  dailyDoubleClueId: string | null;
  categories: readonly BoardCategoryPosition[];
  clues: readonly BoardCluePosition[];
};

export type BoardPlayabilityIssue =
  | 'BOARD_HAS_NO_CATEGORIES'
  | 'BOARD_HAS_NO_CLUES'
  | 'CLUE_HAS_NO_CATEGORY'
  | 'DAILY_DOUBLE_NOT_SELECTED'
  | 'DAILY_DOUBLE_NOT_ON_BOARD';

export class BoardAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BoardAccessError';
  }
}

export class BoardNotPlayableError extends Error {
  constructor(public readonly issues: readonly BoardPlayabilityIssue[]) {
    super(`Board is not playable: ${issues.join(', ')}`);
    this.name = 'BoardNotPlayableError';
  }
}

export function canViewBoard(
  board: BoardAccess,
  viewerUserId: string | null
): boolean {
  return board.isPublic || board.ownerId === viewerUserId;
}

export function canEditBoard(
  board: Pick<BoardAccess, 'ownerId'>,
  viewerUserId: string | null
): boolean {
  return viewerUserId !== null && board.ownerId === viewerUserId;
}

export function requireBoardViewAccess(
  board: BoardAccess,
  viewerUserId: string | null
): void {
  if (!canViewBoard(board, viewerUserId)) {
    throw new BoardAccessError('You do not have access to this board.');
  }
}

export function requireBoardOwner(
  board: Pick<BoardAccess, 'ownerId'>,
  viewerUserId: string | null
): void {
  if (!canEditBoard(board, viewerUserId)) {
    throw new BoardAccessError('Only the board owner can modify this board.');
  }
}

export function requireQuestionCreator(
  question: { creatorId: string },
  viewerUserId: string | null
): void {
  if (viewerUserId === null || question.creatorId !== viewerUserId) {
    throw new BoardAccessError(
      'Only the question creator can modify this question.'
    );
  }
}

export function requireQuestionReuseAccess(
  question: { creatorId: string },
  viewerUserId: string | null
): void {
  if (viewerUserId === null || question.creatorId !== viewerUserId) {
    throw new BoardAccessError(
      'Questions may only be reused by their creator.'
    );
  }
}

export function getBoardPlayabilityIssues(
  board: BoardForPlayability
): BoardPlayabilityIssue[] {
  const issues: BoardPlayabilityIssue[] = [];
  const categoryColumns = new Set(
    board.categories.map((category) => category.colIndex)
  );

  if (board.categories.length === 0) {
    issues.push('BOARD_HAS_NO_CATEGORIES');
  }

  if (board.clues.length === 0) {
    issues.push('BOARD_HAS_NO_CLUES');
  }

  if (board.clues.some((clue) => !categoryColumns.has(clue.colIndex))) {
    issues.push('CLUE_HAS_NO_CATEGORY');
  }

  if (board.dailyDoubleClueId === null) {
    issues.push('DAILY_DOUBLE_NOT_SELECTED');
  } else if (!board.clues.some((clue) => clue.id === board.dailyDoubleClueId)) {
    issues.push('DAILY_DOUBLE_NOT_ON_BOARD');
  }

  return issues;
}

export function requirePlayableBoard(board: BoardForPlayability): void {
  const issues = getBoardPlayabilityIssues(board);

  if (issues.length > 0) {
    throw new BoardNotPlayableError(issues);
  }
}
