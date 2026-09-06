import { unwrapResolverError } from '@apollo/server/errors';
import type { GraphQLFormattedError } from 'graphql';
import { AppError } from '../application/errors.js';

export function formatGraphQLError(
  formattedError: GraphQLFormattedError,
  error: unknown
): GraphQLFormattedError {
  const originalError = unwrapResolverError(error);

  if (!(originalError instanceof AppError)) {
    return formattedError;
  }

  return {
    ...formattedError,
    message: originalError.message,
    extensions: {
      ...formattedError.extensions,
      code: originalError.code,
    },
  };
}
