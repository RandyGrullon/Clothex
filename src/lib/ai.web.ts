// IA para WEB/PWA: sin IA local, todo con servicios gratis en la nube.
// - Quitar fondo: @imgly/background-removal (corre EN el navegador, sin key).
// - Análisis de prenda (visión) y try-on: Pollinations (token gratis).
// - Outfits (texto): Pollinations anónimo (funciona sin token).
// Metro resuelve este archivo en web; en nativo usa ai.ts (IA local).
import type { Garment, GarmentAnalysis, OutfitSuggestion, Profile } from './types';

import {
  ANALYZE_PROMPT,
  blobToDataUrl,
  buildOutfitsPrompt,
  cleanAnalysis,
  cleanOutfits,
  extractJson,
  generateTryOnCore,
  HAS_TRYON,
  POLLINATIONS_TEXT,
  pollinationsChat,
  TRYON_HINT,
} from './ai-core';

export { HAS_TRYON, TRYON_HINT };

export const AI_URL = POLLINATIONS_TEXT;
export const AI_KIND: 'local' | 'cloud' = 'cloud';
export const AI_LABEL = 'IA en la nube (gratis)';
export const AI_ERROR_HINT = 'Revisa tu conexión a internet e inténtalo de nuevo.';

// Modelos de visión a intentar en orden (disponibles con el token gratis).
const VISION_MODELS = ['openai', 'gemini', 'openai-large', 'mistral'];

export async function aiHealth(): Promise<{ ok: boolean; ollama: boolean; model: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(`${POLLINATIONS_TEXT}/models`, { signal: ctrl.signal });
    const ok = res.ok;
    return { ok, ollama: ok, model: 'Pollinations' };
  } catch {
    return { ok: false, ollama: false, model: '' };
  } finally {
    clearTimeout(timer);
  }
}

/** Quita el fondo en el navegador con @imgly/background-removal (gratis, sin key). */
async function imglyCutout(imageB64: string): Promise<string> {
  const { removeBackground } = await import('@imgly/background-removal');
  const blob = await (await fetch(`data:image/jpeg;base64,${imageB64}`)).blob();
  const out = await removeBackground(blob, { output: { format: 'image/png' } });
  const dataUrl = await blobToDataUrl(out);
  return dataUrl.split(',')[1];
}

/** Análisis con visión en la nube; si no hay token o falla, devuelve una base editable. */
async function analyzeGarment(imageB64: string): Promise<GarmentAnalysis> {
  if (HAS_TRYON) {
    const content = [
      { type: 'text', text: ANALYZE_PROMPT },
      { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageB64}` } },
    ];
    for (const model of VISION_MODELS) {
      try {
        const text = await pollinationsChat(content, { model, timeoutMs: 120_000 });
        return cleanAnalysis(extractJson(text));
      } catch {
        // probar el siguiente modelo
      }
    }
  }
  // Sin visión disponible: el usuario edita los campos en la pantalla de revisión.
  return cleanAnalysis({
    name: 'Prenda',
    description: HAS_TRYON ? '' : `Análisis automático no disponible. ${TRYON_HINT}`,
  });
}

/** Quita el fondo y analiza la prenda. Mismo contrato que la versión nativa. */
export async function processGarment(
  imageB64: string,
): Promise<{ cutout_b64: string; analysis: GarmentAnalysis }> {
  const [cutout_b64, analysis] = await Promise.all([
    imglyCutout(imageB64),
    analyzeGarment(imageB64),
  ]);
  return { cutout_b64, analysis };
}

/** Quita el fondo de una foto de la persona (para el modelo/try-on). */
export async function cutoutPerson(imageB64: string): Promise<string> {
  return imglyCutout(imageB64);
}

/** Genera outfits con el modelo de texto gratis (funciona sin token). */
export async function generateOutfits(
  garments: Garment[],
  style: string,
  profile: Profile | null,
): Promise<OutfitSuggestion[]> {
  const slim = garments.map((g) => ({
    id: g.id,
    name: g.name,
    category: g.category,
    subtype: g.subtype,
    material: g.material,
    pattern: g.pattern,
    colors: g.colors,
    styles: g.styles,
  }));
  const prompt = buildOutfitsPrompt(
    slim,
    style,
    profile
      ? { gender: profile.gender, height_cm: profile.height_cm, weight_kg: profile.weight_kg }
      : null,
  );
  const text = await pollinationsChat(prompt, { timeoutMs: 180_000 });
  return cleanOutfits(extractJson(text), new Set(garments.map((g) => g.id)), style);
}

/** Foto generada del dueño con las prendas puestas (Pollinations, gratis). */
export async function generateTryOn(
  personUrl: string,
  garments: Garment[],
  profile: Profile | null,
): Promise<string> {
  return generateTryOnCore(personUrl, garments, profile);
}
