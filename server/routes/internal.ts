import { Router } from 'express';
import { dispatchPendingIntegrationEvents } from '../services/eventDispatcher.js';
import { sendInternalError } from '../lib/httpErrorResponse.js';

export const internalRouter = Router();

internalRouter.post('/webhooks/dispatch', async (req, res) => {
  const secret = process.env.INTERNAL_WEBHOOK_SECRET?.trim();
  if (!secret) {
    res.status(503).json({ error: 'INTERNAL_WEBHOOK_SECRET is not configured' });
    return;
  }
  if (req.headers['x-internal-secret'] !== secret) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  try {
    const n = await dispatchPendingIntegrationEvents();
    res.json({ processed: n });
  } catch (e) {
    sendInternalError(res, e, 'internal/dispatch');
  }
});
