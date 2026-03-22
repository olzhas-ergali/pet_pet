import { Router } from 'express';
import { createUserClient } from '../../lib/supabaseClients.js';
import { sendInternalError } from '../../lib/httpErrorResponse.js';
import { unitPriceForQuantity } from '../../domain/catalogMap.js';
import { deliveryFeeKzt } from '../../domain/delivery.js';

const r = Router();

r.post('/quote', async (req, res) => {
  try {
    const product_id = req.body?.product_id as string | undefined;
    const quantity = Number(req.body?.quantity ?? 1);
    if (!product_id || quantity < 1) {
      res.status(400).json({ error: 'product_id and quantity required' });
      return;
    }
    const supabase = createUserClient(req.accessToken!);
    const { data, error } = await supabase
      .from('products')
      .select(
        `
        id,
        supplier_id,
        name,
        category,
        image_url,
        wholesale_tiers,
        created_at,
        prices (*),
        inventory (*)
      `
      )
      .eq('id', product_id)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    const unit = unitPriceForQuantity(data as never, quantity);
    res.json({ product_id, quantity, unit_price: unit, currency: 'KZT' });
  } catch (e) {
    sendInternalError(res, e, 'pricing/quote');
  }
});

r.post('/cart-quote', async (req, res) => {
  try {
    const lines = req.body?.lines as { product_id: string; quantity: number }[] | undefined;
    if (!Array.isArray(lines) || lines.length === 0) {
      res.status(400).json({ error: 'lines required' });
      return;
    }
    const supabase = createUserClient(req.accessToken!);
    const ids = [...new Set(lines.map((l) => l.product_id))];
    const { data: rows, error } = await supabase
      .from('products')
      .select(
        `
        id,
        supplier_id,
        name,
        category,
        image_url,
        wholesale_tiers,
        created_at,
        prices (*),
        inventory (*)
      `
      )
      .in('id', ids);
    if (error) throw error;
    const byId = new Map((rows ?? []).map((r) => [r.id as string, r]));
    const out: {
      product_id: string;
      quantity: number;
      unit_price: number;
      line_total: number;
    }[] = [];
    let subtotal = 0;
    for (const line of lines) {
      const row = byId.get(line.product_id);
      if (!row) {
        res.status(400).json({ error: 'unknown_product', product_id: line.product_id });
        return;
      }
      const qty = Math.max(1, Number(line.quantity) || 1);
      const unit = unitPriceForQuantity(row as never, qty);
      const lineTotal = unit * qty;
      subtotal += lineTotal;
      out.push({
        product_id: line.product_id,
        quantity: qty,
        unit_price: unit,
        line_total: lineTotal,
      });
    }
    const delivery_fee = deliveryFeeKzt(subtotal);
    res.json({
      lines: out,
      subtotal,
      delivery_fee,
      total: subtotal + delivery_fee,
      currency: 'KZT',
    });
  } catch (e) {
    sendInternalError(res, e, 'pricing/cart-quote');
  }
});

export const pricingRouter = r;
