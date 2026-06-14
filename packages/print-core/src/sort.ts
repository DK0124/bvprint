import type { PrintMode } from './types.js';

export interface PrintPair {
  label: string;
  slip: string;
}

export function arrangePrintPairs(pairs: PrintPair[], mode: PrintMode): string[] {
  switch (mode) {
    case 'LABELS_FIRST':
      return [...pairs.map((pair) => pair.label), ...pairs.map((pair) => pair.slip)];
    case 'SLIPS_FIRST':
      return [...pairs.map((pair) => pair.slip), ...pairs.map((pair) => pair.label)];
    case 'PAIR':
    default:
      return pairs.flatMap((pair) => [pair.label, pair.slip]);
  }
}
