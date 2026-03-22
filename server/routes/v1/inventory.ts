import { Router } from 'express';
import { createUserClient } from '../../lib/supabaseClients.js';

const r = Router();

r.get('/:productId', async (req, res) => {
  try {
    const supabase = createUserClient(req.accessToken!);
    const { data, error } = await supabase
      .from('inventory')
      .select('quantity, product_id')
      .eq('product_id', req.params.productId)
      .maybeSingle();
    if (error) throw error;
    res.json({
      product_id: req.params.productId,
      quantity: data?.quantity ?? 0,
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export const inventoryRouter = r;
