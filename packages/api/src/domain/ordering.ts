// Prisma does not apply an implicit order to relation results. API queries should
// reuse these orderings so callers receive deterministic arrays.
export const boardCategoryOrderBy = [
  { colIndex: 'asc' as const },
  { id: 'asc' as const },
];

export const boardClueOrderBy = [
  { colIndex: 'asc' as const },
  { rowIndex: 'asc' as const },
  { id: 'asc' as const },
];

export const sessionPlayerOrderBy = [
  { position: 'asc' as const },
  { id: 'asc' as const },
];

export const sessionClueOrderBy = boardClueOrderBy;

export const gameSessionOrderBy = [
  { createdAt: 'desc' as const },
  { id: 'asc' as const },
];
