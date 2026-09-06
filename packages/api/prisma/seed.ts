import { prisma } from '../src/db/prisma.js';

const ownerId = 'seed-user-trivia-host';
const publicBoardId = 'seed-board-classic-trivia';
const privateBoardId = 'seed-board-private-practice';

const categories = [
  {
    title: 'World Geography',
    clues: [
      ['This city is the capital of France.', 'Paris'],
      [
        'This river flows through Egypt into the Mediterranean Sea.',
        'The Nile',
      ],
      ['This is the largest country in the world by area.', 'Russia'],
      ['This mountain is the highest point above sea level.', 'Mount Everest'],
      ['This is the only continent located in all four hemispheres.', 'Africa'],
    ],
  },
  {
    title: 'Science',
    clues: [
      ['This planet is known as the Red Planet.', 'Mars'],
      ['This gas makes up most of Earth’s atmosphere.', 'Nitrogen'],
      [
        'This organelle is often called the powerhouse of the cell.',
        'The mitochondrion',
      ],
      ['This scientist formulated the three laws of motion.', 'Isaac Newton'],
      [
        'This scale measures mineral hardness from talc to diamond.',
        'The Mohs scale',
      ],
    ],
  },
  {
    title: 'History',
    clues: [
      ['This ancient civilization built Machu Picchu.', 'The Inca'],
      ['The Magna Carta was sealed in this year.', '1215'],
      ['This wall fell in November 1989.', 'The Berlin Wall'],
      ['This ruler was the first emperor of Rome.', 'Augustus'],
      [
        'This 1648 settlement ended the Thirty Years’ War.',
        'The Peace of Westphalia',
      ],
    ],
  },
  {
    title: 'Books',
    clues: [
      ['This author wrote “Pride and Prejudice.”', 'Jane Austen'],
      ['This hobbit carries the One Ring to Mordor.', 'Frodo Baggins'],
      ['This novel opens with the line “Call me Ishmael.”', 'Moby-Dick'],
      ['This author created the detective Hercule Poirot.', 'Agatha Christie'],
      [
        'This Russian author wrote “The Brothers Karamazov.”',
        'Fyodor Dostoevsky',
      ],
    ],
  },
  {
    title: 'Movies',
    clues: [
      [
        'This 1995 Pixar film was the first fully computer-animated feature.',
        'Toy Story',
      ],
      [
        'This actor played Indiana Jones in “Raiders of the Lost Ark.”',
        'Harrison Ford',
      ],
      ['This fictional African nation is home to Black Panther.', 'Wakanda'],
      [
        'This director made “Jaws,” “E.T.,” and “Jurassic Park.”',
        'Steven Spielberg',
      ],
      ['This film won Best Picture at the first Academy Awards.', 'Wings'],
    ],
  },
] as const;

const values = [200, 400, 600, 800, 1000] as const;

function questionId(colIndex: number, rowIndex: number): string {
  return `seed-question-${colIndex}-${rowIndex}`;
}

function clueId(colIndex: number, rowIndex: number): string {
  return `seed-public-clue-${colIndex}-${rowIndex}`;
}

async function seed() {
  await prisma.$transaction(async (tx) => {
    await tx.user.upsert({
      where: { id: ownerId },
      create: {
        id: ownerId,
        authProvider: 'GOOGLE',
        providerUid: 'seed-firebase-user',
        email: 'host@example.com',
        displayName: 'Trivia Host',
      },
      update: {
        email: 'host@example.com',
        displayName: 'Trivia Host',
      },
    });

    for (const [colIndex, category] of categories.entries()) {
      for (const [rowIndex, [prompt, answer]] of category.clues.entries()) {
        await tx.question.upsert({
          where: { id: questionId(colIndex, rowIndex) },
          create: {
            id: questionId(colIndex, rowIndex),
            creatorId: ownerId,
            prompt,
            answer,
          },
          update: { creatorId: ownerId, prompt, answer },
        });
      }
    }

    await tx.board.upsert({
      where: { id: publicBoardId },
      create: {
        id: publicBoardId,
        ownerId,
        title: 'Classic Trivia Night',
        description: 'A complete 5×5 board for a friendly game night.',
        isPublic: true,
      },
      update: {
        ownerId,
        title: 'Classic Trivia Night',
        description: 'A complete 5×5 board for a friendly game night.',
        isPublic: true,
        dailyDoubleClueId: null,
      },
    });

    await tx.boardClue.deleteMany({ where: { boardId: publicBoardId } });
    await tx.boardCategory.deleteMany({ where: { boardId: publicBoardId } });

    await tx.boardCategory.createMany({
      data: categories.map((category, colIndex) => ({
        id: `seed-public-category-${colIndex}`,
        boardId: publicBoardId,
        colIndex,
        title: category.title,
      })),
    });

    await tx.boardClue.createMany({
      data: categories.flatMap((category, colIndex) =>
        category.clues.map((_clue, rowIndex) => ({
          id: clueId(colIndex, rowIndex),
          boardId: publicBoardId,
          colIndex,
          rowIndex,
          value: values[rowIndex],
          questionId: questionId(colIndex, rowIndex),
        }))
      ),
    });

    await tx.board.update({
      where: { id: publicBoardId },
      data: { dailyDoubleClueId: clueId(1, 3) },
    });

    await tx.board.upsert({
      where: { id: privateBoardId },
      create: {
        id: privateBoardId,
        ownerId,
        title: 'Private Practice Board',
        description: 'A private board demonstrating question reuse.',
        isPublic: false,
      },
      update: {
        ownerId,
        title: 'Private Practice Board',
        description: 'A private board demonstrating question reuse.',
        isPublic: false,
        dailyDoubleClueId: null,
      },
    });

    await tx.boardClue.deleteMany({ where: { boardId: privateBoardId } });
    await tx.boardCategory.deleteMany({ where: { boardId: privateBoardId } });

    await tx.boardCategory.create({
      data: {
        id: 'seed-private-category-0',
        boardId: privateBoardId,
        colIndex: 0,
        title: 'Warm-up',
      },
    });

    await tx.boardClue.create({
      data: {
        id: 'seed-private-clue-0-0',
        boardId: privateBoardId,
        colIndex: 0,
        rowIndex: 0,
        value: 200,
        // The same Question row is used on the public board.
        questionId: questionId(0, 0),
      },
    });

    await tx.board.update({
      where: { id: privateBoardId },
      data: { dailyDoubleClueId: 'seed-private-clue-0-0' },
    });
  });
}

seed()
  .then(() => {
    console.log(
      'Seeded a user, public/private boards, and reusable questions.'
    );
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
