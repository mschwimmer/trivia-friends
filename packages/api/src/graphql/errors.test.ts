import { GraphQLError } from 'graphql';
import { badUserInput } from '../application/errors.js';
import { formatGraphQLError } from './errors.js';

describe('GraphQL error formatting', () => {
  it('maps application errors to stable GraphQL extension codes', () => {
    const applicationError = badUserInput('Invalid board input.');
    const resolverError = new GraphQLError(applicationError.message, {
      originalError: applicationError,
      path: ['createBoard'],
    });

    expect(formatGraphQLError(resolverError.toJSON(), resolverError)).toEqual(
      expect.objectContaining({
        message: 'Invalid board input.',
        extensions: expect.objectContaining({ code: 'BAD_USER_INPUT' }),
      })
    );
  });

  it('leaves unexpected errors to Apollo Server', () => {
    const resolverError = new GraphQLError('Unexpected failure');
    const formatted = resolverError.toJSON();

    expect(formatGraphQLError(formatted, resolverError)).toBe(formatted);
  });
});
