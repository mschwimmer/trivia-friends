import { readFileSync } from 'node:fs';
export { resolvers } from './resolvers/index.js';

export const typeDefs = readFileSync(
  new URL('./schema.graphql', `file://${process.cwd()}/src/graphql/schema.ts`),
  'utf8'
);
