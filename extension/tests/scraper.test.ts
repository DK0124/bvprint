import { describe, it, expect } from 'vitest';
import { scrapeCheckedOrderIds, scrapeCheckedOrders } from '../src/bvshop/scraper.js';

function createOrderPageHtml(inputs: Array<{ value: string; checked: boolean }>): Document {
  const html = `
    <!DOCTYPE html>
    <html>
    <body>
      <div class="grid">
        ${inputs.map((input) => `
          <div class="xl:col-span-1 col-span-12 text-center">
            <label class="checkbox-area my-2 mx-3">
              <input type="checkbox" name="order_form_id[]" value="${input.value}" ${input.checked ? 'checked' : ''}>
              <span></span>
            </label>
            <p></p>
          </div>
        `).join('')}
      </div>
    </body>
    </html>
  `;

  return new DOMParser().parseFromString(html, 'text/html');
}

describe('scrapeCheckedOrderIds', () => {
  it('returns only checked order ids', () => {
    const doc = createOrderPageHtml([
      { value: '1726850', checked: true },
      { value: '1726849', checked: false },
      { value: '1726848', checked: true },
    ]);

    expect(scrapeCheckedOrderIds(doc)).toEqual(['1726850', '1726848']);
  });

  it('deduplicates repeated checked values', () => {
    const doc = createOrderPageHtml([
      { value: '1726850', checked: true },
      { value: '1726850', checked: true },
      { value: '1726848', checked: true },
    ]);

    expect(scrapeCheckedOrderIds(doc)).toEqual(['1726850', '1726848']);
  });

  it('returns empty array when nothing is checked', () => {
    const doc = createOrderPageHtml([
      { value: '1726850', checked: false },
    ]);

    expect(scrapeCheckedOrderIds(doc)).toEqual([]);
  });

  it('ignores blank values', () => {
    const doc = createOrderPageHtml([
      { value: '', checked: true },
      { value: '1726850', checked: true },
    ]);

    expect(scrapeCheckedOrderIds(doc)).toEqual(['1726850']);
  });

  it('keeps scrapeCheckedOrders alias compatible', () => {
    const doc = createOrderPageHtml([
      { value: '1726850', checked: true },
    ]);

    expect(scrapeCheckedOrders(doc)).toEqual(['1726850']);
  });
});
