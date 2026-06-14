export function makePrintSeq(index: number, total: number): string {
  const safeTotal = Math.max(1, total);
  const width = Math.max(3, String(safeTotal).length);
  const safeIndex = Math.min(Math.max(index, 1), safeTotal);
  return `${String(safeIndex).padStart(width, '0')} / ${String(safeTotal).padStart(width, '0')}`;
}
