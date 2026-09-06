# API

GraphQL API service built with Node.js, TypeScript, Apollo Server, and Prisma (PostgreSQL).

Run commands below from the repository root.

## Development

```sh
yarn dev:api
```

This runs the API in watch mode with `tsx`.

## Build and run

```sh
yarn workspace api start
```

The production build uses `tsconfig.build.json`, which excludes `*.test.ts`, and
runs the compiled server from `dist`.

## Testing

```sh
yarn test:api
yarn test:watch
```

The root Jest runner selects the API's Node-based Jest project. The main API
`tsconfig.json` includes Jest globals and test files, so `describe`, `it`, and
`expect` are recognized by VS Code and checked by TypeScript.

## Type checking

```sh
yarn workspace api type-check
```

This checks both production source and TypeScript test files without emitting
JavaScript.

## Source organization

The API is organized by responsibility and feature:

```text
src/
├── application/       shared application errors, authorization, validation, and service context
├── auth/              Firebase request identity and guest-host token handling
├── db/                Prisma client setup
├── generated/         generated Prisma client (do not edit by hand)
├── graphql/           GraphQL schema, context, error mapping, and thin resolvers
│   └── resolvers/     transport adapters grouped by API feature
├── modules/
│   ├── boards/        board queries, mutations, policies, and ordering
│   ├── questions/     reusable-question policies
│   ├── sessions/      session snapshots, players, scoring, and host policies
│   └── users/         profile workflows
├── index.ts           process entry point
└── server.ts          HTTP and Apollo Server composition
```

Business workflows belong in `modules`, not in GraphQL resolvers. A module
service accepts plain arguments plus an application `ServiceContext`, so the
same behavior can later be called from the v1 WebSocket transport without
depending on Apollo types. GraphQL resolvers translate their context and delegate
to those services; relation-field resolvers perform GraphQL-specific data
loading. `application/errors.ts` defines transport-independent error codes, and
`graphql/errors.ts` maps them to GraphQL extensions at the server boundary.

Tests are colocated with the code they exercise. Prefer policy and service unit
tests under their feature module, with GraphQL tests reserved for schema and
transport behavior.

## Authentication

Set `FIREBASE_PROJECT_ID` in `packages/api/.env`. The API verifies Firebase ID
tokens from `Authorization: Bearer <token>`, makes the corresponding local user
available as `context.currentUser`, and creates or updates that user on the first
authenticated request. Verification does not require a checked-in service-account
private key.

## GraphQL API

Public board browsing is available through `publicBoards` and `board`. List
queries use `limit` and `offset`; limits default to 20 and are capped at 50.
Public board results expose category/clue layout but do not expose question
content or Daily Double placement. Owners can retrieve editable content through
the same board fields while authenticated, and can search their reusable
questions with `myQuestions`.

Authenticated users can create a default 5×5 board, edit its metadata,
categories, clues, questions, ordering, and Daily Double, and hard-delete it.
Only the owner may use those mutations.

Public boards can be snapshotted into game sessions by signed-in or guest hosts.
A guest receives `guestHostToken` exactly once from `startGameSession`; clients
must store it and send it with later session queries and host mutations. Only a
peppered SHA-256 hash is stored in Postgres. Signed-in hosts are authorized by
their verified local user identity. Session mutations support player management,
one-time clue opening, ordinary score adjustments, and Daily Double wagers.

Expected application errors are mapped to the GraphQL extension codes `UNAUTHENTICATED`,
`FORBIDDEN`, `NOT_FOUND`, `BAD_USER_INPUT`, and `CONFLICT`.

## Prisma

```sh
yarn workspace api prisma:generate
yarn workspace api prisma:migrate
yarn workspace api prisma:studio
yarn workspace api prisma:seed
```

To change the data model, edit `prisma/schema.prisma` and create a migration with
`yarn workspace api prisma:migrate`.
