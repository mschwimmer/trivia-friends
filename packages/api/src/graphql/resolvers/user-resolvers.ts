import type { Context } from '../context.js';
import { userService } from '../../modules/users/user-service.js';
import { serviceContext } from './helpers.js';

export const userResolvers = {
  Query: {
    health: () => 'ok',
    me: (_parent: unknown, _args: unknown, context: Context) =>
      context.currentUser,
  },
  Mutation: {
    updateDisplayName: (
      _parent: unknown,
      args: Parameters<typeof userService.updateDisplayName>[0],
      context: Context
    ) => userService.updateDisplayName(args, serviceContext(context)),
  },
};
