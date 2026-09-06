import type { Context } from '../context.js';
import type {
  Board,
  BoardCategory,
  BoardClue,
  Question,
} from '../../generated/prisma/client.js';
import {
  boardCategoryOrderBy,
  boardClueOrderBy,
} from '../../modules/boards/board-ordering.js';
import { boardQueryService } from '../../modules/boards/board-query-service.js';
import { boardService } from '../../modules/boards/board-service.js';
import { serviceContext } from './helpers.js';

export const boardResolvers = {
  Query: {
    publicBoards: (
      _parent: unknown,
      args: Parameters<typeof boardQueryService.publicBoards>[0],
      context: Context
    ) => boardQueryService.publicBoards(args, serviceContext(context)),
    board: (
      _parent: unknown,
      args: Parameters<typeof boardQueryService.board>[0],
      context: Context
    ) => boardQueryService.board(args, serviceContext(context)),
    myBoards: (
      _parent: unknown,
      args: Parameters<typeof boardQueryService.myBoards>[0],
      context: Context
    ) => boardQueryService.myBoards(args, serviceContext(context)),
    myQuestions: (
      _parent: unknown,
      args: Parameters<typeof boardQueryService.myQuestions>[0],
      context: Context
    ) => boardQueryService.myQuestions(args, serviceContext(context)),
  },
  Mutation: {
    createBoard: (
      _parent: unknown,
      args: Parameters<typeof boardService.createBoard>[0],
      context: Context
    ) => boardService.createBoard(args, serviceContext(context)),
    updateBoard: (
      _parent: unknown,
      args: Parameters<typeof boardService.updateBoard>[0],
      context: Context
    ) => boardService.updateBoard(args, serviceContext(context)),
    deleteBoard: (
      _parent: unknown,
      args: Parameters<typeof boardService.deleteBoard>[0],
      context: Context
    ) => boardService.deleteBoard(args, serviceContext(context)),
    addBoardCategory: (
      _parent: unknown,
      args: Parameters<typeof boardService.addBoardCategory>[0],
      context: Context
    ) => boardService.addBoardCategory(args, serviceContext(context)),
    updateBoardCategory: (
      _parent: unknown,
      args: Parameters<typeof boardService.updateBoardCategory>[0],
      context: Context
    ) => boardService.updateBoardCategory(args, serviceContext(context)),
    reorderBoardCategories: (
      _parent: unknown,
      args: Parameters<typeof boardService.reorderBoardCategories>[0],
      context: Context
    ) => boardService.reorderBoardCategories(args, serviceContext(context)),
    deleteBoardCategory: (
      _parent: unknown,
      args: Parameters<typeof boardService.deleteBoardCategory>[0],
      context: Context
    ) => boardService.deleteBoardCategory(args, serviceContext(context)),
    addBoardClue: (
      _parent: unknown,
      args: Parameters<typeof boardService.addBoardClue>[0],
      context: Context
    ) => boardService.addBoardClue(args, serviceContext(context)),
    updateBoardClue: (
      _parent: unknown,
      args: Parameters<typeof boardService.updateBoardClue>[0],
      context: Context
    ) => boardService.updateBoardClue(args, serviceContext(context)),
    deleteBoardClue: (
      _parent: unknown,
      args: Parameters<typeof boardService.deleteBoardClue>[0],
      context: Context
    ) => boardService.deleteBoardClue(args, serviceContext(context)),
    selectDailyDouble: (
      _parent: unknown,
      args: Parameters<typeof boardService.selectDailyDouble>[0],
      context: Context
    ) => boardService.selectDailyDouble(args, serviceContext(context)),
  },
  Question: {
    creator: (question: Question, _args: unknown, context: Context) =>
      context.prisma.user.findUniqueOrThrow({
        where: { id: question.creatorId },
      }),
  },
  Board: {
    owner: (board: Board, _args: unknown, context: Context) =>
      context.prisma.user.findUniqueOrThrow({ where: { id: board.ownerId } }),
    dailyDoubleClue: (board: Board, _args: unknown, context: Context) =>
      board.ownerId === context.currentUser?.id && board.dailyDoubleClueId
        ? context.prisma.boardClue.findUnique({
            where: { id: board.dailyDoubleClueId },
          })
        : null,
    categories: (board: Board, _args: unknown, context: Context) =>
      context.prisma.boardCategory.findMany({
        where: { boardId: board.id },
        orderBy: boardCategoryOrderBy,
      }),
    clues: (board: Board, _args: unknown, context: Context) =>
      context.prisma.boardClue.findMany({
        where: { boardId: board.id },
        orderBy: boardClueOrderBy,
      }),
  },
  BoardCategory: {
    clues: (category: BoardCategory, _args: unknown, context: Context) =>
      context.prisma.boardClue.findMany({
        where: { boardId: category.boardId, colIndex: category.colIndex },
        orderBy: boardClueOrderBy,
      }),
  },
  BoardClue: {
    question: async (clue: BoardClue, _args: unknown, context: Context) => {
      const board = await context.prisma.board.findUniqueOrThrow({
        where: { id: clue.boardId },
        select: { ownerId: true },
      });
      return board.ownerId === context.currentUser?.id
        ? context.prisma.question.findUnique({ where: { id: clue.questionId } })
        : null;
    },
  },
};
