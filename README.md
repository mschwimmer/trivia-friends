# Trivia Friends

Trivia Friends is a Jeopardy-style local multiplayer web app. Hosts create trivia
boards, run games in the room, keep score, and let players buzz in from their
phones.

The repository is a Yarn workspace containing:

- `packages/api`: Apollo Server, Express, Prisma, and Postgres.
- `packages/web`: Next.js, React, and Apollo Client.
- `packages/shared`: a placeholder for types that are genuinely shared later.

## Prerequisites

- Node.js 24 LTS. Prisma 7 also supports Node 20.19+ and 22.12+, but this
  repository pins Node 24 in `.nvmrc`.
- Corepack with Yarn 4.
- Docker with Docker Compose.

With nvm installed:

```sh
nvm install
nvm use
corepack enable
```

## Local setup

Install dependencies and create local environment files:

```sh
yarn install
cp packages/api/.env.example packages/api/.env
cp packages/web/.env.example packages/web/.env.local
```

The checked-in examples contain development-safe defaults. Fill in the Firebase
web app values and project ID before testing sign-in.

Start Postgres and apply the existing migrations:

```sh
docker compose up -d postgres
yarn workspace api prisma:migrate
```

Optionally load the repeatable v1 demo seed:

```sh
yarn workspace api prisma:seed
```

The seed creates one demo owner, a complete public 5×5 board, a small private
board, 25 questions, and one Daily Double per board. The private board reuses a
question from the public board.

## Development

Start the API and web app together:

```sh
yarn dev
```

Or run them independently:

```sh
yarn dev:api
yarn dev:web
```

The web app runs at [http://localhost:3000](http://localhost:3000), GraphQL runs
at [http://localhost:4000/graphql](http://localhost:4000/graphql), and the API
health endpoint is [http://localhost:4000/healthz](http://localhost:4000/healthz).
The home page reports whether Apollo Client can reach the GraphQL `health` query.

## Authentication

The web app signs users in with Google through Firebase Authentication. Apollo
Client sends the current Firebase ID token as a bearer token; the API verifies
it against `FIREBASE_PROJECT_ID` and upserts the matching local user. Firebase's
UID and email remain private API data, while the user chooses a separate public
display name.

For local setup, enable Google as a Firebase Authentication provider and add
`localhost` as an authorized domain. Copy the Firebase web app values into
`packages/web/.env.local` and set the matching project ID in
`packages/api/.env`. Token verification only uses the project ID and Firebase's
public signing certificates, so no service-account private key is stored in this
repository.

## V1 data model rules

- Boards and questions have one owner/creator. Only that user may modify them,
  and v1 question reuse is limited to the question creator.
- Public boards are visible to everyone; private boards are visible only to their
  owner.
- `Board.dailyDoubleClueId` is the sole Daily Double source of truth. It may be
  empty while editing, but a playable board must have a category, a clue, and a
  Daily Double that points to one of its own clues.
- Categories sort by `colIndex`, clues by `colIndex` then `rowIndex`, players by
  `position`, and sessions by newest first. Reusable query ordering constants are
  in `packages/api/src/domain/ordering.ts`.
- Deleting a board cascades through its categories and template clues while
  preserving already-snapshotted sessions. Questions in use by clues cannot be
  deleted.

The reusable access and playability checks live in
`packages/api/src/domain/board-policy.ts` and must be called by board, question,
and session resolvers as those operations are added.

## Database commands

Run these from the repository root:

```sh
yarn workspace api prisma:generate
yarn workspace api prisma:migrate
yarn workspace api prisma:migrate:deploy
yarn workspace api prisma:seed
yarn workspace api prisma:studio
```

Create migrations with `prisma:migrate` during development. Use
`prisma:migrate:deploy` in deployed environments.

## Project checks

```sh
yarn format:check
yarn lint
yarn type-check
yarn test
yarn build
```

Jest runs from the repository root and delegates to separate `api`, `web`, and
`shared` projects:

```sh
yarn test:api
yarn test:web
yarn test:shared
yarn test:watch
```

The API and shared projects use a Node test environment. The web project uses
Next.js's Jest transformer, jsdom, and React Testing Library. Each package's main
TypeScript configuration includes Jest globals so test files receive editor and
type-check support in VS Code.

The production API build generates Prisma Client, compiles with
`packages/api/tsconfig.build.json` so test files are not emitted, and copies the
GraphQL schema into `dist`. The web build uses `NEXT_PUBLIC_API_URL` as its
GraphQL endpoint.

## Environment variables

API variables are documented in `packages/api/.env.example`; browser-visible web
variables are documented in `packages/web/.env.example`. Do not commit populated
`.env` or `.env.local` files.
