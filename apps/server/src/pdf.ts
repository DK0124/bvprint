import { chromium } from 'playwright';

export async function htmlToPdf(html: string): Promise<Uint8Array> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });
  const pdf = await page.pdf({
    printBackground: true,
    width: '100mm',
    height: '150mm',
    margin: { top: '5mm', right: '5mm', bottom: '5mm', left: '5mm' },
  });
  await browser.close();
  return Uint8Array.from(pdf);
}
