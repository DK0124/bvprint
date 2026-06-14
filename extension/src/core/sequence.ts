/**
 * makePrintSeq — 產生流水編號字串
 * 格式: "001 / 025"
 * width = max(3, len(String(total)))
 *
 * @param index 0-based index
 * @param total total count
 */
export function makePrintSeq(index: number, total: number): string {
  const width = Math.max(3, String(total).length);
  const seq = String(index + 1).padStart(width, '0');
  const tot = String(total).padStart(width, '0');
  return `${seq} / ${tot}`;
}
