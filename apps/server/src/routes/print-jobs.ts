import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { BvshopApiClient, BvOrderDetail } from '@bvprint/bvshop-api';
import {
  arrangePrintPairs,
  decodeTcatPdf,
  detectProvider,
  makePrintSeq,
  mergePdfs,
  stampSequenceOnPdf,
  type LogisticProvider,
  type PrintJob,
  type PrintMode,
} from '@bvprint/print-core';
import { renderThermalSlipHtml } from '@bvprint/templates';
import { htmlToPdf } from '../pdf.js';
import { printJobStore } from '../store.js';

const createJobSchema = z.object({
  orderIds: z.array(z.number().int().positive()).min(1),
  senderName: z.string().min(1),
  senderPhone: z.string().min(1),
  paperSize: z.enum(['THERMAL_100X150', 'A4', 'A5', 'ROLL_80MM']).default('THERMAL_100X150'),
  mode: z.enum(['PAIR', 'LABELS_FIRST', 'SLIPS_FIRST']).default('PAIR'),
  providerMap: z.record(z.string(), z.enum(['ecpay', 'payuni', 'tcat', 'sf', 'unknown'])).optional(),
});

const generatePdfSchema = z.object({
  confirmCreateLabels: z.boolean().default(false),
  senderName: z.string().optional(),
  senderPhone: z.string().optional(),
});

interface ExtendedJob extends PrintJob {
  details: BvOrderDetail[];
  warnings: string[];
}

export function createPrintJobsRouter(client: BvshopApiClient) {
  const router = Router();

  router.post('/print-jobs', async (req, res) => {
    try {
      const parsed = createJobSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: 'Invalid body', errors: parsed.error.flatten() });
      }

      const { orderIds, mode, paperSize, providerMap, senderName, senderPhone } = parsed.data;
      const details: BvOrderDetail[] = [];
      const warnings: string[] = [];

      for (const orderId of orderIds) {
        const order = await client.getOrder(orderId);
        details.push(order);

        if (order.logisticTraceCode) {
          warnings.push(`訂單 ${order.uid} 已有物流追蹤碼，請避免重複產生物流單。`);
        }
        const provider = providerMap?.[String(order.id)] ?? detectProvider(order.logisticMethod);
        if (provider === 'unknown') {
          warnings.push(`訂單 ${order.uid} 物流方式無法辨識，需手動確認。`);
        }
      }

      const total = details.length;
      const orders = details.map((order, idx) => ({
        orderId: order.id,
        orderUid: order.uid,
        printSeqText: makePrintSeq(idx + 1, total),
        provider: (providerMap?.[String(order.id)] ?? detectProvider(order.logisticMethod)) as LogisticProvider,
      }));

      const jobId = randomUUID();
      const job: ExtendedJob = {
        jobId,
        createdAt: new Date().toISOString(),
        mode,
        paperSize,
        senderName,
        senderPhone,
        orderIds,
        orders,
        details,
        warnings,
      };

      printJobStore.set(jobId, job);

      return res.json({ jobId, total, orders, warnings });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create print job';
      return res.status(500).json({ message });
    }
  });

  router.post('/print-jobs/:jobId/pdf', async (req, res) => {
    try {
      const job = printJobStore.get(req.params.jobId) as ExtendedJob | undefined;
      if (!job) {
        return res.status(404).json({ message: 'Print job not found' });
      }

      const parseBody = generatePdfSchema.safeParse(req.body ?? {});
      if (!parseBody.success) {
        return res.status(400).json({ message: 'Invalid body', errors: parseBody.error.flatten() });
      }

      const { confirmCreateLabels } = parseBody.data;
      const manualWarnings: string[] = [...job.warnings];

      if (!confirmCreateLabels) {
        manualWarnings.push('尚未確認建立物流單，已跳過呼叫物流單建立 API。');
      }

      const pairs = [] as { label: Uint8Array; slip: Uint8Array; provider: LogisticProvider }[];

      for (const order of job.details) {
        const orderMeta = job.orders.find((o) => o.orderId === order.id);
        if (!orderMeta) continue;

        const slipHtml = renderThermalSlipHtml(order, orderMeta.printSeqText, job.paperSize);
        const slipPdf = await htmlToPdf(slipHtml);
        const stampedSlip = await stampSequenceOnPdf(slipPdf, orderMeta.printSeqText);

        let labelPdf = stampedSlip;
        if (confirmCreateLabels) {
          if (orderMeta.provider === 'tcat') {
            const label = await client.createTcatLabel({
              id: order.id,
              senderName: parseBody.data.senderName ?? job.senderName,
              senderPhone: parseBody.data.senderPhone ?? job.senderPhone,
            });
            labelPdf = await stampSequenceOnPdf(decodeTcatPdf(label.pdf), orderMeta.printSeqText);
          } else if (orderMeta.provider === 'ecpay') {
            const result = await client.createEcpayLabel({
              id: order.id,
              senderName: parseBody.data.senderName ?? job.senderName,
              senderPhone: parseBody.data.senderPhone ?? job.senderPhone,
            });
            manualWarnings.push(`訂單 ${order.uid} 綠界物流單需手動處理 htmlForm。`);
            if (!result.html) manualWarnings.push(`訂單 ${order.uid} 綠界物流單回傳為空。`);
          } else if (orderMeta.provider === 'payuni') {
            const result = await client.createPayuniLabel({
              id: order.id,
              senderName: parseBody.data.senderName ?? job.senderName,
              senderPhone: parseBody.data.senderPhone ?? job.senderPhone,
            });
            manualWarnings.push(`訂單 ${order.uid} PayUni 物流單需手動處理 htmlForm。`);
            if (!result.html) manualWarnings.push(`訂單 ${order.uid} PayUni 物流單回傳為空。`);
          } else if (orderMeta.provider === 'sf') {
            const result = await client.createSfLabel({
              id: order.id,
              senderName: parseBody.data.senderName ?? job.senderName,
              senderPhone: parseBody.data.senderPhone ?? job.senderPhone,
            });
            manualWarnings.push(`訂單 ${order.uid} 順豐物流單需手動列印：${result.printUrl}`);
          } else {
            manualWarnings.push(`訂單 ${order.uid} provider unknown，跳過物流單建立。`);
          }
        }

        pairs.push({ label: labelPdf, slip: stampedSlip, provider: orderMeta.provider });
      }

      const docKeys = arrangePrintPairs(
        pairs.map((pair, idx) => ({ label: `L${idx}`, slip: `S${idx}` })),
        job.mode as PrintMode,
      );

      const docMap = new Map<string, Uint8Array>();
      pairs.forEach((pair, idx) => {
        docMap.set(`L${idx}`, pair.label);
        docMap.set(`S${idx}`, pair.slip);
      });

      const merged = await mergePdfs(
        docKeys.map((k) => docMap.get(k)).filter((x): x is Uint8Array => Boolean(x)),
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('X-Bvprint-Warnings', encodeURIComponent(JSON.stringify([...new Set(manualWarnings)])));
      return res.send(Buffer.from(merged));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate PDF';
      return res.status(500).json({ message });
    }
  });

  return router;
}
