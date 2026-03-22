import { Router } from 'express';
import { dispatchPendingIntegrationEvents } from '../services/eventDispatcher.js';

export const internalRouter = Router();

internalRouter.post('/webhooks/dispatch', async (req, res) => {
  const secret = process.env.INTERNAL_WEBHOOK_SECRET;
  if (secret && req.headers['x-internal-secret'] !== secret) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  try {
    const n = await dispatchPendingIntegrationEvents();
    res.json({ processed: n });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});
