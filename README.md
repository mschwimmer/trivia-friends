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

The checked-in examples contain development-safe defaults. Firebase values may
remain empty until authentication work begins.

Start Postgres and apply the existing migrations:

```sh
docker compose up -d postgres
yarn workspace api prisma:migrate
```

Optionally load demo data once `packages/api/prisma/seed.ts` contains a v1 seed:

```sh
yarn workspace api prisma:seed
```

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

The production API build generates Prisma Client, compiles TypeScript, and copies
the GraphQL schema into `dist`. The web build uses `NEXT_PUBLIC_API_URL` as its
GraphQL endpoint.

## Environment variables

API variables are documented in `packages/api/.env.example`; browser-visible web
variables are documented in `packages/web/.env.example`. Do not commit populated
`.env` or `.env.local` files.
