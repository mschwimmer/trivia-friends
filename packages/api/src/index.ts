import 'dotenv/config';
import { startServer } from './server.js';

const server = await startServer();

console.log(`Trivia Friends API ready at ${server.url}/graphql`);

let stopping = false;

const stop = async (signal: NodeJS.Signals) => {
  if (stopping) {
    return;
  }

  stopping = true;
  console.log(`Received ${signal}; shutting down.`);
  await server.stop();
  process.exitCode = 0;
};

process.once('SIGINT', () => void stop('SIGINT'));
process.once('SIGTERM', () => void stop('SIGTERM'));
