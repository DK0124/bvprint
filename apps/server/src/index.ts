import express from 'express';
import { BvshopApiClient } from '@bvprint/bvshop-api';
import { env } from './env.js';
import { createOrdersRouter } from './routes/orders.js';
import { createPrintJobsRouter } from './routes/print-jobs.js';

if (!env.BVSHOP_API_TOKEN) {
  // eslint-disable-next-line no-console
  console.warn('[WARN] BVSHOP_API_TOKEN is empty. API requests to BVSHOP will fail until it is set.');
}

const app = express();
app.use(express.json({ limit: '2mb' }));

const client = new BvshopApiClient({
  baseUrl: env.BVSHOP_API_BASE,
  token: env.BVSHOP_API_TOKEN,
});

app.get('/healthz', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api', createOrdersRouter(client));
app.use('/api', createPrintJobsRouter(client));

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  res.status(500).json({ message });
});

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on http://localhost:${env.PORT}`);
});
