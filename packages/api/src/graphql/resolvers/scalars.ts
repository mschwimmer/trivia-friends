import { GraphQLScalarType, Kind } from 'graphql';
import { badUserInput } from '../../application/errors.js';

function parseDateTime(value: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw badUserInput('DateTime must be a valid ISO-8601 date-time string.');
  }

  return date;
}

export const dateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'An ISO-8601 date-time string.',
  serialize(value: unknown) {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return parseDateTime(value).toISOString();
    throw new TypeError('DateTime values must be Date objects or strings.');
  },
  parseValue(value: unknown) {
    if (typeof value !== 'string') {
      throw new TypeError('DateTime input must be a string.');
    }
    return parseDateTime(value);
  },
  parseLiteral(ast) {
    return ast.kind === Kind.STRING ? parseDateTime(ast.value) : null;
  },
});
