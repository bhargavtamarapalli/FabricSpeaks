import express from 'express';
import session from 'express-session';
import MemoryStoreFactory from 'memorystore';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { registerRoutes } from '../../server/routes';

const MemoryStore = MemoryStoreFactory(session as any);

export async function startTestServer() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(helmet());
  app.use(cors({ origin: false }));
  app.use(rateLimit({ windowMs: 60_000, max: 120 }));

  const server = await registerRoutes(app);

  // listen on ephemeral port
  await new Promise<void>((resolve) => {
    (server as any).listen(0, '127.0.0.1', () => resolve());
  });

  return { server, app };
}
