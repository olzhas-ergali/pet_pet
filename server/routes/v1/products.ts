import { Router, type Request } from 'express';
import { createUserClient } from '../../lib/supabaseClients.js';
import { mapDbRowToProduct } from '../../domain/catalogMap.js';

const r = Router();

function client(req: Request) {
  return createUserClient(req.accessToken!);
}

r.get('/', async (req, res) => {
  try {
    const supabase = client(req);
    const { data, error } = await supabase
      .from('products')
      .select(
        `
      *,
      prices (*),
      inventory (*)
    `
      )
      .order('created_at', { ascending: true });
    if (error) throw error;
    const mapped = (data ?? []).map((row) => mapDbRowToProduct(row as never));
    res.json({ data: mapped });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

r.get('/:id', async (req, res) => {
  try {
    const supabase = client(req);
    const { data, error } = await supabase
      .from('products')
      .select(
        `
      *,
      prices (*),
      inventory (*)
    `
      )
      .eq('id', req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json({ data: mapDbRowToProduct(data as never) });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export const productsRouter = r;
