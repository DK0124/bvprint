import { describe, it, expect } from 'vitest';
import { scrapeCheckedOrders } from '../src/bvshop/scraper.js';

/** Helper to create a simple DOM with a fake order table */
function createFakeOrderTableHtml(orders: Array<{
  id: string;
  uid: string;
  receiver: string;
  logistic: string;
  checked: boolean;
}>): Document {
  const html = `
    <!DOCTYPE html>
    <html>
    <body>
      <table>
        <tbody>
          ${orders.map((o) => `
            <tr data-id="${o.id}" data-uid="${o.uid}">
              <td><input type="checkbox" ${o.checked ? 'checked' : ''} data-id="${o.id}" /></td>
              <td>${o.id}</td>
              <td>${o.uid}</td>
              <td>${o.receiver}</td>
              <td>${o.logistic}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
}

describe('scrapeCheckedOrders', () => {
  it('returns only checked orders', () => {
    const doc = createFakeOrderTableHtml([
      { id: '101', uid: 'UID101', receiver: '王小明', logistic: '黑貓宅急便', checked: true },
      { id: '102', uid: 'UID102', receiver: '李大華', logistic: '綠界 7-ELEVEN', checked: false },
      { id: '103', uid: 'UID103', receiver: '陳美麗', logistic: '順豐宅配', checked: true },
    ]);

    const result = scrapeCheckedOrders(doc);
    expect(result).toHaveLength(2);
    expect(result.map((o) => o.orderId)).toContain('101');
    expect(result.map((o) => o.orderId)).toContain('103');
    expect(result.map((o) => o.orderId)).not.toContain('102');
  });

  it('returns empty array when nothing is checked', () => {
    const doc = createFakeOrderTableHtml([
      { id: '201', uid: 'UID201', receiver: '張三', logistic: '黑貓宅急便', checked: false },
    ]);
    const result = scrapeCheckedOrders(doc);
    expect(result).toHaveLength(0);
  });

  it('extracts orderId from data-id attribute on row', () => {
    const doc = createFakeOrderTableHtml([
      { id: '301', uid: 'UID301', receiver: '孫五', logistic: '黑貓宅急便', checked: true },
    ]);
    const result = scrapeCheckedOrders(doc);
    expect(result[0].orderId).toBe('301');
  });

  it('does not throw on malformed DOM', () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString('<html><body></body></html>', 'text/html');
    expect(() => scrapeCheckedOrders(doc)).not.toThrow();
    expect(scrapeCheckedOrders(doc)).toHaveLength(0);
  });

  it('marks partial=true when required fields are missing', () => {
    // Row has checkbox but no id / uid
    const parser = new DOMParser();
    const doc = parser.parseFromString(`
      <html><body>
        <table><tbody>
          <tr><td><input type="checkbox" checked /></td><td></td></tr>
        </tbody></table>
      </body></html>
    `, 'text/html');
    const result = scrapeCheckedOrders(doc);
    // If any order is found, it should be partial
    if (result.length > 0) {
      expect(result[0].partial).toBe(true);
    }
  });
});
