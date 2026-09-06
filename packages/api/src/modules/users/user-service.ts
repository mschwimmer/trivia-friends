import { requireActor } from '../../application/authorization.js';
import type { ServiceContext } from '../../application/service-context.js';
import { requiredText } from '../../application/validation.js';

export const userService = {
  updateDisplayName: async (
    { displayName }: { displayName: string },
    context: ServiceContext
  ) => {
    const actor = requireActor(context.actor);
    const normalizedDisplayName = requiredText(displayName, 'Display name', 50);

    return context.db.user.update({
      where: { id: actor.id },
      data: { displayName: normalizedDisplayName },
    });
  },
};
