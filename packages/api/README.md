# API

GraphQL API service built with Node.js, TypeScript, Apollo Server, and Prisma (PostgreSQL).

# Development

```
yarn dev
```

Runs API in watch mode using ts-node-dev

# Build and Run

```
yarn start
```

Compiles TypeScript and runs the built server from /dist (subject to change)

# Testing

```
yarn test
yarn test:watch
```

# Type Checking

```
yarn type-check
```

# Prisma

```
yarn prisma:generate    # generate Prisma client
yarn prisma:migrate     # run migrations
yarn prisma:studio      # open Prisma studio
yarn prisma:seed        # seed the database
```

To add something new, edit the schema, then run yarn prisma:migrate dev.
