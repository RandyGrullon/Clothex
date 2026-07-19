// Cliente del servidor de IA local (ai-server: rembg + Ollama).
import type { Garment, GarmentAnalysis, OutfitSuggestion, Profile } from './types';

export const AI_URL = process.env.EXPO_PUBLIC_AI_URL ?? 'http://localhost:8000';

async function post<T>(path: string, body: unknown, timeoutMs = 240_000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${AI_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`IA respondió ${res.status}: ${await res.text()}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function aiHealth(): Promise<{ ok: boolean; ollama: boolean; model: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const res = await fetch(`${AI_URL}/health`, { signal: ctrl.signal });
    return await res.json();
  } catch {
    return { ok: false, ollama: false, model: '' };
  } finally {
    clearTimeout(timer);
  }
}

/** Quita el fondo y analiza la prenda. Devuelve el recorte PNG en base64 + análisis. */
export async function processGarment(
  imageB64: string,
): Promise<{ cutout_b64: string; analysis: GarmentAnalysis }> {
  return post('/process', { image_b64: imageB64 });
}

/** Genera outfits que combinen a partir del closet, para un estilo dado. */
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
  const body = {
    garments: slim,
    style,
    profile: profile
      ? {
          gender: profile.gender,
          height_cm: profile.height_cm,
          weight_kg: profile.weight_kg,
        }
      : null,
  };
  const res = await post<{ outfits: OutfitSuggestion[] }>('/outfits', body);
  return res.outfits ?? [];
}
