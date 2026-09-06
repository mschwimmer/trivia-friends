import type {
  BoardClue,
  Prisma,
  Question,
  User,
} from '../../generated/prisma/client.js';
import {
  badUserInput,
  conflict,
  forbidden,
  notFound,
} from '../../application/errors.js';
import { requireActor } from '../../application/authorization.js';
import type { ServiceContext } from '../../application/service-context.js';
import { requireQuestionReuseAccess } from '../questions/question-policy.js';
import {
  gridIndex,
  optionalText,
  positiveInteger,
  requiredText,
  uniqueIds,
} from '../../application/validation.js';
import { requireBoardOwner } from './board-policy.js';

const DEFAULT_VALUES = [200, 400, 600, 800, 1000] as const;

type QuestionSelectionInput = {
  questionId?: string | null;
  prompt?: string | null;
  answer?: string | null;
};

type CreateBoardInput = {
  title: string;
  description?: string | null;
  isPublic?: boolean;
};

type UpdateBoardInput = {
  title?: string | null;
  description?: string | null;
  isPublic?: boolean | null;
};

type AddBoardCategoryInput = {
  boardId: string;
  title: string;
  colIndex: number;
};

type UpdateBoardCategoryInput = {
  title?: string | null;
  colIndex?: number | null;
};

type AddBoardClueInput = {
  boardId: string;
  colIndex: number;
  rowIndex: number;
  value: number;
  question: QuestionSelectionInput;
};

type UpdateBoardClueInput = {
  colIndex?: number | null;
  rowIndex?: number | null;
  value?: number | null;
  question?: QuestionSelectionInput | null;
};

async function selectedQuestion(
  tx: Prisma.TransactionClient,
  user: User,
  input: QuestionSelectionInput
): Promise<Question> {
  const wantsReuse = Boolean(input.questionId);
  const suppliesPrompt = input.prompt !== undefined && input.prompt !== null;
  const suppliesAnswer = input.answer !== undefined && input.answer !== null;

  if (wantsReuse && (suppliesPrompt || suppliesAnswer)) {
    throw badUserInput(
      'Choose an existing question ID or provide prompt and answer text, not both.'
    );
  }

  if (input.questionId) {
    const question = await tx.question.findUnique({
      where: { id: input.questionId },
    });

    if (!question) {
      throw notFound('Question');
    }

    try {
      requireQuestionReuseAccess(question, user.id);
    } catch {
      throw forbidden('Questions may only be reused by their creator.');
    }

    return question;
  }

  if (!suppliesPrompt || !suppliesAnswer) {
    throw badUserInput('A new question requires both prompt and answer text.');
  }

  return tx.question.create({
    data: {
      creatorId: user.id,
      prompt: requiredText(input.prompt!, 'Question prompt', 2000),
      answer: requiredText(input.answer!, 'Question answer', 1000),
    },
  });
}

async function clueAndOwnedBoard(
  context: ServiceContext,
  id: string
): Promise<BoardClue> {
  const clue = await context.db.boardClue.findUnique({ where: { id } });

  if (!clue) {
    throw notFound('Board clue');
  }

  await ownedBoard(context, clue.boardId);
  return clue;
}

async function ownedBoard(context: ServiceContext, id: string) {
  const board = await context.db.board.findUnique({ where: { id } });

  if (!board) {
    throw notFound('Board');
  }

  try {
    requireBoardOwner(board, context.actor?.id ?? null);
  } catch {
    throw forbidden('Only the board owner can modify this board.');
  }

  return board;
}

async function translatePrismaErrors<T>(
  action: () => Promise<T>,
  conflictMessage: string
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    const prismaError = error as Partial<Prisma.PrismaClientKnownRequestError>;

    if (prismaError.code === 'P2002') {
      throw conflict(conflictMessage);
    }

    if (prismaError.code === 'P2025') {
      throw notFound('Resource');
    }

    throw error;
  }
}

export const boardService = {
  createBoard: async (
    { input }: { input: CreateBoardInput },
    context: ServiceContext
  ) => {
    const user = requireActor(context.actor);
    const title = requiredText(input.title, 'Board title', 100);
    const description = optionalText(
      input.description,
      'Board description',
      500
    );

    return context.db.$transaction(async (tx) => {
      const board = await tx.board.create({
        data: {
          ownerId: user.id,
          title,
          description,
          isPublic: input.isPublic ?? true,
        },
      });

      for (let colIndex = 0; colIndex < 5; colIndex += 1) {
        await tx.boardCategory.create({
          data: { boardId: board.id, colIndex, title: '' },
        });

        for (
          let rowIndex = 0;
          rowIndex < DEFAULT_VALUES.length;
          rowIndex += 1
        ) {
          const question = await tx.question.create({
            data: { creatorId: user.id, prompt: '', answer: '' },
          });
          await tx.boardClue.create({
            data: {
              boardId: board.id,
              colIndex,
              rowIndex,
              value: DEFAULT_VALUES[rowIndex],
              questionId: question.id,
            },
          });
        }
      }

      return board;
    });
  },

  updateBoard: async (
    { id, input }: { id: string; input: UpdateBoardInput },
    context: ServiceContext
  ) => {
    await ownedBoard(context, id);
    const data: Prisma.BoardUpdateInput = {};

    if (input.title !== undefined && input.title !== null) {
      data.title = requiredText(input.title, 'Board title', 100);
    }
    if (input.description !== undefined) {
      data.description = optionalText(
        input.description,
        'Board description',
        500
      );
    }
    if (input.isPublic !== undefined && input.isPublic !== null) {
      data.isPublic = input.isPublic;
    }

    if (Object.keys(data).length === 0) {
      throw badUserInput('At least one board field must be provided.');
    }

    return context.db.board.update({ where: { id }, data });
  },

  deleteBoard: async ({ id }: { id: string }, context: ServiceContext) => {
    await ownedBoard(context, id);
    await context.db.board.delete({ where: { id } });
    return true;
  },

  addBoardCategory: async (
    { input }: { input: AddBoardCategoryInput },
    context: ServiceContext
  ) => {
    await ownedBoard(context, input.boardId);
    return translatePrismaErrors(
      () =>
        context.db.boardCategory.create({
          data: {
            boardId: input.boardId,
            colIndex: gridIndex(input.colIndex, 'Column index'),
            title: requiredText(input.title, 'Category title', 100),
          },
        }),
      'That board already has a category at this column.'
    );
  },

  updateBoardCategory: async (
    { id, input }: { id: string; input: UpdateBoardCategoryInput },
    context: ServiceContext
  ) => {
    const category = await context.db.boardCategory.findUnique({
      where: { id },
    });
    if (!category) throw notFound('Board category');
    await ownedBoard(context, category.boardId);

    const data: Prisma.BoardCategoryUpdateInput = {};
    if (input.title !== undefined && input.title !== null) {
      data.title = requiredText(input.title, 'Category title', 100);
    }
    if (input.colIndex !== undefined && input.colIndex !== null) {
      data.colIndex = gridIndex(input.colIndex, 'Column index');
    }
    if (Object.keys(data).length === 0) {
      throw badUserInput('At least one category field must be provided.');
    }

    return translatePrismaErrors(
      () => context.db.boardCategory.update({ where: { id }, data }),
      'That board already has a category at this column.'
    );
  },

  reorderBoardCategories: async (
    { boardId, categoryIds }: { boardId: string; categoryIds: string[] },
    context: ServiceContext
  ) => {
    await ownedBoard(context, boardId);
    uniqueIds(categoryIds, 'Category IDs');
    const categories = await context.db.boardCategory.findMany({
      where: { boardId },
      select: { id: true, colIndex: true },
    });
    const actualIds = new Set(categories.map(({ id }) => id));
    if (
      categoryIds.length !== categories.length ||
      categoryIds.some((id) => !actualIds.has(id))
    ) {
      throw badUserInput(
        'Category IDs must contain every board category once.'
      );
    }

    const temporaryBase =
      Math.max(-1, ...categories.map(({ colIndex }) => colIndex)) +
      categories.length +
      1;

    await context.db.$transaction(async (tx) => {
      for (let index = 0; index < categoryIds.length; index += 1) {
        await tx.boardCategory.update({
          where: { id: categoryIds[index] },
          data: { colIndex: temporaryBase + index },
        });
      }
      for (let index = 0; index < categoryIds.length; index += 1) {
        await tx.boardCategory.update({
          where: { id: categoryIds[index] },
          data: { colIndex: index },
        });
      }
    });

    return context.db.board.findUniqueOrThrow({ where: { id: boardId } });
  },

  deleteBoardCategory: async (
    { id }: { id: string },
    context: ServiceContext
  ) => {
    const category = await context.db.boardCategory.findUnique({
      where: { id },
    });
    if (!category) throw notFound('Board category');
    await ownedBoard(context, category.boardId);
    await context.db.boardCategory.delete({ where: { id } });
    return true;
  },

  addBoardClue: async (
    { input }: { input: AddBoardClueInput },
    context: ServiceContext
  ) => {
    const user = requireActor(context.actor);
    await ownedBoard(context, input.boardId);
    const colIndex = gridIndex(input.colIndex, 'Column index');
    const rowIndex = gridIndex(input.rowIndex, 'Row index');
    const value = positiveInteger(input.value, 'Clue value');

    return translatePrismaErrors(
      () =>
        context.db.$transaction(async (tx) => {
          const category = await tx.boardCategory.findUnique({
            where: {
              boardId_colIndex: { boardId: input.boardId, colIndex },
            },
          });
          if (!category) throw badUserInput('The clue column has no category.');
          const question = await selectedQuestion(tx, user, input.question);
          return tx.boardClue.create({
            data: {
              boardId: input.boardId,
              colIndex,
              rowIndex,
              value,
              questionId: question.id,
            },
          });
        }),
      'That board position already contains a clue.'
    );
  },

  updateBoardClue: async (
    { id, input }: { id: string; input: UpdateBoardClueInput },
    context: ServiceContext
  ) => {
    const user = requireActor(context.actor);
    const clue = await clueAndOwnedBoard(context, id);

    return translatePrismaErrors(
      () =>
        context.db.$transaction(async (tx) => {
          const data: Prisma.BoardClueUpdateInput = {};
          const colIndex =
            input.colIndex === undefined || input.colIndex === null
              ? clue.colIndex
              : gridIndex(input.colIndex, 'Column index');
          if (colIndex !== clue.colIndex) {
            const category = await tx.boardCategory.findUnique({
              where: {
                boardId_colIndex: { boardId: clue.boardId, colIndex },
              },
            });
            if (!category)
              throw badUserInput('The clue column has no category.');
            data.category = {
              connect: {
                boardId_colIndex: { boardId: clue.boardId, colIndex },
              },
            };
          }
          if (input.rowIndex !== undefined && input.rowIndex !== null) {
            data.rowIndex = gridIndex(input.rowIndex, 'Row index');
          }
          if (input.value !== undefined && input.value !== null) {
            data.value = positiveInteger(input.value, 'Clue value');
          }
          if (input.question) {
            const question = await selectedQuestion(tx, user, input.question);
            data.question = { connect: { id: question.id } };
          }
          if (Object.keys(data).length === 0) {
            throw badUserInput('At least one clue field must be provided.');
          }
          return tx.boardClue.update({ where: { id }, data });
        }),
      'That board position already contains a clue.'
    );
  },

  deleteBoardClue: async ({ id }: { id: string }, context: ServiceContext) => {
    await clueAndOwnedBoard(context, id);
    await context.db.boardClue.delete({ where: { id } });
    return true;
  },

  selectDailyDouble: async (
    { boardId, clueId }: { boardId: string; clueId: string },
    context: ServiceContext
  ) => {
    await ownedBoard(context, boardId);
    const clue = await context.db.boardClue.findUnique({
      where: { id: clueId },
    });
    if (!clue || clue.boardId !== boardId) {
      throw badUserInput('The Daily Double must be a clue on this board.');
    }
    return context.db.board.update({
      where: { id: boardId },
      data: { dailyDoubleClueId: clueId },
    });
  },
};
