import { Router } from 'express';
import { requireBearer } from '../../middleware/auth.js';
import { productsRouter } from './products.js';
import { ordersRouter } from './orders.js';
import { pricingRouter } from './pricing.js';
import { inventoryRouter } from './inventory.js';

export const v1Router = Router();

v1Router.use(requireBearer);
v1Router.use('/products', productsRouter);
v1Router.use('/orders', ordersRouter);
v1Router.use('/pricing', pricingRouter);
v1Router.use('/inventory', inventoryRouter);
