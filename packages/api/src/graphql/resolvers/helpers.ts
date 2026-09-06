import type { Context } from '../context.js';
import type { ServiceContext } from '../../application/service-context.js';

export function serviceContext(context: Context): ServiceContext {
  return { db: context.prisma, actor: context.currentUser };
}
