import { Router } from 'express';
import { createUserClient } from '../../lib/supabaseClients.js';
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
    res.status(500).json({ error: (e as Error).message });
  }
});

r.post('/', async (req, res) => {
  try {
    const lines = req.body?.lines as { product_id: string; quantity: number }[];
    if (!Array.isArray(lines) || lines.length === 0) {
      res.status(400).json({ error: 'lines required' });
      return;
    }
    const supabase = createUserClient(req.accessToken!);
    const raw = (await validateCartStockRpc(supabase, lines)) as { ok?: boolean };
    if (raw.ok !== true) {
      res.status(400).json(raw);
      return;
    }
    const orderId = await submitOrderRpc(supabase, lines);
    const { data: ord, error: oe } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('id', orderId)
      .single();
    if (oe) throw oe;
    await runPostOrderIntegrations(orderId, Number(ord?.total_amount ?? 0));
    res.json({ orderId });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
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
    res.status(500).json({ error: (e as Error).message });
  }
});

export const ordersRouter = r;
