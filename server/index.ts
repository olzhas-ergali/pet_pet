import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { v1Router } from './routes/v1/index.js';
import { internalRouter } from './routes/internal.js';

const app = express();
const port = Number(process.env.BFF_PORT ?? 3001);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'bff' });
});

app.use('/api/v1', v1Router);
app.use('/api/internal', internalRouter);

app.listen(port, () => {
  console.log(`bff listening on :${port}`);
});
