export type AppErrorCode =
  | 'BAD_USER_INPUT'
  | 'CONFLICT'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'UNAUTHENTICATED';

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function badUserInput(message: string): AppError {
  return new AppError('BAD_USER_INPUT', message);
}

export function conflict(message: string): AppError {
  return new AppError('CONFLICT', message);
}

export function forbidden(message: string): AppError {
  return new AppError('FORBIDDEN', message);
}

export function notFound(resource: string): AppError {
  return new AppError('NOT_FOUND', `${resource} was not found.`);
}

export function unauthenticated(
  message = 'Authentication is required.'
): AppError {
  return new AppError('UNAUTHENTICATED', message);
}
