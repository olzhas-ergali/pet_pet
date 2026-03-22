import { Router } from 'express';
import { createUserClient } from '../../lib/supabaseClients.js';
import { sendInternalError } from '../../lib/httpErrorResponse.js';
import { parseOrderLines } from '../../lib/orderLines.js';
import {
  validateCartStockRpc,
  submitOrderRpc,
  runPostOrderIntegrations,
} from '../../services/orderService.js';

const r = Router();

r.get('/', async (req, res) => {
  try {
    const supabase = createUserClient(req.accessToken!);
    const { data, error } = await supabase.from('orders').select('*').order('created_at', {
      ascending: false,
    });
    if (error) throw error;
    res.json({ data: data ?? [] });
  } catch (e) {
    sendInternalError(res, e, 'orders/list');
  }
});

r.post('/', async (req, res) => {
  try {
    const lines = parseOrderLines(req.body?.lines);
    if (!lines) {
      res.status(400).json({ error: 'invalid_lines' });
      return;
    }
    const meta = (req.body?.meta as Record<string, unknown> | undefined) ?? {};

    const supabase = createUserClient(req.accessToken!);
    const raw = (await validateCartStockRpc(supabase, lines)) as { ok?: boolean };
    if (raw.ok !== true) {
      res.status(400).json(raw);
      return;
    }
    const orderId = await submitOrderRpc(supabase, lines, meta);
    const { data: ord, error: oe } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('id', orderId)
      .single();
    if (oe) throw oe;
    const total = Number(ord?.total_amount ?? 0);
    try {
      await runPostOrderIntegrations(orderId, total);
    } catch (postErr) {
      console.error('[orders/create] post-integration', postErr);
    }
    res.json({ orderId });
  } catch (e) {
    sendInternalError(res, e, 'orders/create');
  }
});

r.post('/validate-cart', async (req, res) => {
  try {
    const lines = parseOrderLines(req.body?.lines, { allowEmpty: true });
    if (lines === null) {
      res.status(400).json({ error: 'invalid_lines' });
      return;
    }
    if (lines.length === 0) {
      res.json({ ok: true });
      return;
    }
    const supabase = createUserClient(req.accessToken!);
    const raw = (await validateCartStockRpc(supabase, lines)) as { ok?: boolean };
    if (raw.ok !== true) {
      res.status(400).json(raw);
      return;
    }
    res.json({ ok: true });
  } catch (e) {
    sendInternalError(res, e, 'orders/validate-cart');
  }
});

export const ordersRouter = r;
