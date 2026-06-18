import { Router } from 'express';
import { z } from 'zod';
import type { BvshopApiClient } from '@bvprint/bvshop-api';

const querySchema = z.object({
  startAt: z.string().optional(),
  endAt: z.string().optional(),
  orderStatus: z.string().optional(),
  paymentStatus: z.string().optional(),
  logisticStatus: z.string().optional(),
  customerId: z.coerce.number().optional(),
  dealerCode: z.string().optional(),
  dateType: z.enum(['created', 'paid', 'cancel']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  withDetail: z.coerce.number().int().min(0).max(1).optional(),
});

export function createOrdersRouter(client: BvshopApiClient) {
  const router = Router();

  router.get('/orders', async (req, res) => {
    try {
      const parse = querySchema.safeParse(req.query);
      if (!parse.success) {
        return res.status(400).json({ message: 'Invalid query', errors: parse.error.flatten() });
      }

      const data = await client.listOrders({ ...parse.data, withDetail: 1 });
      return res.json(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to query orders';
      return res.status(500).json({ message });
    }
  });

  return router;
}
