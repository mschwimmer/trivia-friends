import { boardClueOrderBy } from '../boards/board-ordering.js';

export const sessionPlayerOrderBy = [
  { position: 'asc' as const },
  { id: 'asc' as const },
];

export const sessionClueOrderBy = boardClueOrderBy;

export const gameSessionOrderBy = [
  { createdAt: 'desc' as const },
  { id: 'asc' as const },
];
