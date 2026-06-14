/**
 * Print Page — main entry
 * Reads print request from chrome.storage.local and renders thermal slips
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PrintPage } from './PrintPage.js';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <PrintPage />
    </StrictMode>
  );
}
