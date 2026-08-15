import { readFileSync } from 'node:fs';
import { GraphQLScalarType, Kind } from 'graphql';

export const typeDefs = readFileSync(
  new URL('./schema.graphql', `file://${process.cwd()}/src/graphql/schema.ts`),
  'utf8'
);

export const resolvers = {
  DateTime: new GraphQLScalarType({
    name: 'DateTime',
    description: 'An ISO-8601 date-time string.',
    serialize(value: unknown) {
      if (value instanceof Date) {
        return value.toISOString();
      }

      if (typeof value === 'string') {
        return new Date(value).toISOString();
      }

      throw new TypeError('DateTime values must be Date objects or strings.');
    },
    parseValue(value: unknown) {
      if (typeof value !== 'string') {
        throw new TypeError('DateTime input must be a string.');
      }

      return new Date(value);
    },
    parseLiteral(ast) {
      return ast.kind === Kind.STRING ? new Date(ast.value) : null;
    },
  }),
  Query: {
    health: () => 'ok',
  },
};
