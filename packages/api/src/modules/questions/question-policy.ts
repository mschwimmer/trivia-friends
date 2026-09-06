import { BoardAccessError } from '../boards/board-policy.js';

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
