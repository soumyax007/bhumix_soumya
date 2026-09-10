import type { ScanResult } from '../types';

const SCAN_URL = import.meta.env.VITE_SCAN_URL;

if (!SCAN_URL) {
  throw new Error('Missing VITE_SCAN_URL environment variable.');
}

/**
 * Upload a document to the scanner API and get structured extracted data.
 * Cold starts on Render free tier can take 30-50s — do NOT set a short timeout.
 */
export async function extractDocument(file: File): Promise<ScanResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${SCAN_URL}/extract`, {
    method: 'POST',
    body: formData,
  });

  const body = await res.json();

  if (!res.ok) {
    const message = body?.error || body?.detail || 'Scan failed';
    throw new Error(message);
  }

  return body as ScanResult;
}
