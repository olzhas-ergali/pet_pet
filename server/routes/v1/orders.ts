import { Router } from 'express';
import { createUserClient } from '../../lib/supabaseClients.js';
import { sendInternalError } from '../../lib/httpErrorResponse.js';
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
    const lines = req.body?.lines as { product_id: string; quantity: number }[];
    if (!Array.isArray(lines) || lines.length === 0) {
      res.status(400).json({ error: 'lines required' });
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
    await runPostOrderIntegrations(orderId, Number(ord?.total_amount ?? 0));
    res.json({ orderId });
  } catch (e) {
    sendInternalError(res, e, 'orders/create');
  }
});

r.post('/validate-cart', async (req, res) => {
  try {
    const lines = req.body?.lines as { product_id: string; quantity: number }[];
    if (!Array.isArray(lines)) {
      res.status(400).json({ error: 'lines required' });
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
