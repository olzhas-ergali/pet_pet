import { Router } from 'express';
import { createUserClient } from '../../lib/supabaseClients.js';
import { sendInternalError } from '../../lib/httpErrorResponse.js';

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
    sendInternalError(res, e, 'inventory/get');
  }
});

export const inventoryRouter = r;
