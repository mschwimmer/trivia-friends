// look into apollo server basics for graphql

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import createContext from './context';
import { typeDefs, resolvers } from './graphql/schema.js';

export type startServerOptions = {
  port?: number;
  host?: string;
};

export async function startServer(options: startServerOptions = {}) {
  const port = options.port ?? Number(process.env.PORT ?? 4000);
  const host = options.host ?? process.env.HOST ?? '0.0.0.0';

  const app = express();
  const httpServer = http.createServer(app);

  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await apollo.start();

  app.get('/healthz', (_req, res) => {
    res.status(200).send('ok');
  });

  app.use(
    '/graphql',
    cors(),
    bodyParser.json(),
    expressMiddleware(apollo, {
      context: async ({ req }) => createContext({ req }),
    })
  );
}
