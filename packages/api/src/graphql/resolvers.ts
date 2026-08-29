import { GraphQLError, GraphQLScalarType, Kind } from 'graphql';
import type { Context } from '../context.js';
import type { User } from '../generated/prisma/client.js';
import { requireCurrentUser } from './resolver-auth.js';

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
    me: (_parent: unknown, _args: unknown, context: Context) =>
      context.currentUser,
  },
  Mutation: {
    updateDisplayName: async (
      _parent: unknown,
      { displayName }: { displayName: string },
      context: Context
    ): Promise<User> => {
      const currentUser = requireCurrentUser(context);
      const normalizedDisplayName = displayName.trim();

      if (
        normalizedDisplayName.length < 1 ||
        normalizedDisplayName.length > 50
      ) {
        throw new GraphQLError(
          'Display name must be between 1 and 50 characters.',
          { extensions: { code: 'BAD_USER_INPUT' } }
        );
      }

      return context.prisma.user.update({
        where: { id: currentUser.id },
        data: { displayName: normalizedDisplayName },
      });
    },
  },
};
