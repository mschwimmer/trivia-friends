import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@as-integrations/express5';
import cors from 'cors';
import express from 'express';
import http from 'node:http';
import createContext from './context.js';
import { resolvers, typeDefs } from './graphql/schema.js';

export type StartServerOptions = {
  port?: number;
  host?: string;
};

export async function startServer(options: StartServerOptions = {}) {
  const port = options.port ?? Number(process.env.PORT ?? 4000);
  const host = options.host ?? process.env.HOST ?? '0.0.0.0';

  const app = express();
  const httpServer = http.createServer(app);
  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await apollo.start();

  app.get('/healthz', (_req, res) => {
    res.status(200).send('ok');
  });

  app.use(
    '/graphql',
    cors({
      origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    }),
    express.json(),
    expressMiddleware(apollo, {
      context: async ({ req }) => createContext({ req }),
    })
  );

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen({ port, host }, () => {
      httpServer.off('error', reject);
      resolve();
    });
  });

  return {
    app,
    apollo,
    httpServer,
    url: `http://${host}:${port}`,
    stop: async () => apollo.stop(),
  };
}
