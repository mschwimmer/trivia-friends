import { boardResolvers } from './board-resolvers.js';
import { dateTimeScalar } from './scalars.js';
import { sessionResolvers } from './session-resolvers.js';
import { userResolvers } from './user-resolvers.js';

export const resolvers = {
  DateTime: dateTimeScalar,
  Query: {
    ...userResolvers.Query,
    ...boardResolvers.Query,
    ...sessionResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...boardResolvers.Mutation,
    ...sessionResolvers.Mutation,
  },
  Question: boardResolvers.Question,
  Board: boardResolvers.Board,
  BoardCategory: boardResolvers.BoardCategory,
  BoardClue: boardResolvers.BoardClue,
  GameSession: sessionResolvers.GameSession,
};
