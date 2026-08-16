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

## Prisma

```sh
yarn workspace api prisma:generate
yarn workspace api prisma:migrate
yarn workspace api prisma:studio
yarn workspace api prisma:seed
```

To change the data model, edit `prisma/schema.prisma` and create a migration with
`yarn workspace api prisma:migrate`.
