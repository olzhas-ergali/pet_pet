import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { v1Router } from './routes/v1/index.js';
import { internalRouter } from './routes/internal.js';
import { bffCorsOptions } from './lib/corsConfig.js';

const app = express();
const port = Number(process.env.BFF_PORT ?? 3001);

app.use(cors(bffCorsOptions()));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'bff' });
});

app.use('/api/v1', v1Router);
app.use('/api/internal', internalRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.startsWith('CORS blocked')) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  console.error('[bff] unhandled', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`bff listening on :${port}`);
});
