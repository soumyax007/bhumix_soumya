import type { ScanResult, TranslatedResult } from '../types';

const TRANSLATE_URL = import.meta.env.VITE_TRANSLATE_URL;

if (!TRANSLATE_URL) {
  throw new Error('Missing VITE_TRANSLATE_URL environment variable.');
}

/**
 * Translate the scan result from source language to target language.
 * Cold starts on Render free tier can take 30-50s.
 */
export async function translateResult(
  scanResult: ScanResult,
  sourceLang: string,
  targetLang: string
): Promise<TranslatedResult> {
  const res = await fetch(`${TRANSLATE_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scan_result: scanResult,
      source_lang: sourceLang,
      target_lang: targetLang,
    }),
  });

  const body = await res.json();

  if (!res.ok) {
    const message = body?.detail || body?.error || 'Translation failed';
    throw new Error(message);
  }

  return body as TranslatedResult;
}
