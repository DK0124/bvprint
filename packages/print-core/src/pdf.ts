import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface SequenceStampOptions {
  x?: number;
  y?: number;
  size?: number;
}

export async function stampSequenceOnPdf(
  pdfBytes: Uint8Array,
  seq: string,
  options: SequenceStampOptions = {},
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  if (!firstPage) return pdfBytes;

  const { width, height } = firstPage.getSize();
  const x = options.x ?? 18;
  const y = options.y ?? height - 24;
  const size = options.size ?? 10;
  firstPage.drawText(`#${seq.replace(/\s+/g, '')}`, {
    x: Math.min(x, width - 120),
    y: Math.min(y, height - size - 4),
    size,
    font,
    color: rgb(0.15, 0.15, 0.15),
  });

  return pdfDoc.save();
}

export async function mergePdfs(pdfList: Uint8Array[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create();
  for (const bytes of pdfList) {
    const doc = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }
  return merged.save();
}

export function decodeTcatPdf(input: string): Uint8Array {
  const compact = input.trim().replace(/\s+/g, '');
  const looksBase64 = /^[A-Za-z0-9+/=]+$/.test(compact) && compact.length % 4 === 0;
  if (looksBase64) {
    try {
      return Uint8Array.from(Buffer.from(compact, 'base64'));
    } catch {
      // If base64 parsing fails, fall back to raw bytes for MVP compatibility with unknown tcat payload variants.
      // TODO: confirm the exact non-base64 tcat payload format and decide whether production should reject instead.
    }
  }
  const rawBytes = Uint8Array.from(Buffer.from(input));
  if (rawBytes.length === 0) {
    throw new Error('TCAT PDF payload is empty');
  }
  return rawBytes;
}
