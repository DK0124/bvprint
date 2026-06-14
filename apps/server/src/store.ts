import type { PrintJob } from '@bvprint/print-core';

export const printJobStore = new Map<string, PrintJob>();
// TODO: MVP uses in-memory Map only. Production should persist encrypted job metadata securely.
