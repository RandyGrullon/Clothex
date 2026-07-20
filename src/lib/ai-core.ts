// Núcleo de IA compartido entre plataformas (ai.ts nativo / ai.web.ts PWA):
// prompts, saneadores de JSON y el generador de try-on (Pollinations, gratis).
import type { Category, Garment, GarmentAnalysis, OutfitSuggestion, Profile } from './types';

export const POLLINATIONS_TEXT = 'https://text.pollinations.ai';
export const POLLINATIONS_IMAGE = 'https://image.pollinations.ai';

export const POLLINATIONS_TOKEN = process.env.EXPO_PUBLIC_POLLINATIONS_TOKEN ?? '';
/** El try-on generativo y la visión en la nube requieren el token gratis de enter.pollinations.ai */
export const HAS_TRYON = POLLINATIONS_TOKEN.length > 0;

export const TRYON_HINT =
  'Para generar fotos con IA crea un token GRATIS en enter.pollinations.ai y ponlo en .env como EXPO_PUBLIC_POLLINATIONS_TOKEN.';

const VALID_CATS = new Set(['top', 'bottom', 'outerwear', 'dress', 'shoes', 'accessory']);
const VALID_STYLES = new Set([
  'casual',
  'formal',
  'semiformal',
  'estetico',
  'old_money',
  'streetwear',
  'deportivo',
]);

export const ANALYZE_PROMPT = `Eres un experto en moda. Analiza la prenda de ropa de la imagen.
Responde SOLO con JSON válido, con exactamente estas claves:
{
  "name": "nombre corto y natural en español, ej: 'Camisa oxford azul'",
  "category": "una de: top | bottom | outerwear | dress | shoes | accessory",
  "subtype": "tipo específico en español, ej: camiseta, camisa, jeans, chinos, blazer, sneakers",
  "material": "tela/material estimado en español, ej: algodón, lino, mezclilla, lana, cuero, poliéster",
  "pattern": "patrón en español: liso, rayas, cuadros, estampado, logo…",
  "fit": "corte: slim, regular, oversize, recto…",
  "colors": [{"name": "nombre del color en español", "hex": "#RRGGBB"}] (1 a 4 colores dominantes de la prenda, ignora el fondo),
  "styles": lista con los estilos que le quedan a la prenda, solo de: ["casual","formal","semiformal","estetico","old_money","streetwear","deportivo"],
  "seasons": lista de: ["primavera","verano","otoño","invierno"],
  "description": "1-2 frases en español sobre la prenda y con qué combina"
}`;

export function buildOutfitsPrompt(
  garments: Pick<Garment, 'id' | 'name' | 'category' | 'subtype' | 'material' | 'pattern' | 'colors' | 'styles'>[],
  style: string,
  profile: { gender?: string | null; height_cm?: number | null; weight_kg?: number | null } | null,
): string {
  return `Eres un estilista experto. Este es el closet del usuario (JSON):
${JSON.stringify(garments)}

Perfil del usuario: ${JSON.stringify(profile ?? {})}

Crea de 1 a 3 outfits de estilo "${style}" combinando SOLO prendas del closet (usa sus "id" exactos).
Reglas:
- Combina por teoría del color (armonía, contraste, neutros) y coherencia de material/estilo.
- Un outfit ideal: 1 top + 1 bottom + 1 shoes (opcional outerwear y accessory), o 1 dress + shoes.
- Si faltan categorías, arma lo mejor posible con lo que hay (mínimo 2 prendas).
- No inventes ids.

Responde SOLO JSON:
{"outfits": [{"name": "nombre corto en español", "style": "${style}", "garment_ids": ["id1","id2"], "reason": "por qué combinan estos colores/telas, en español, 1-2 frases", "score": 1-10}]}`;
}

/** Extrae el primer objeto JSON de una respuesta de modelo (tolera texto alrededor). */
export function extractJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error(`El modelo no devolvió JSON: ${text.slice(0, 200)}`);
    return JSON.parse(m[0]);
  }
}

/** Sanea un análisis crudo para que la app nunca reciba campos rotos. */
export function cleanAnalysis(raw: any): GarmentAnalysis {
  const colors = (Array.isArray(raw?.colors) ? raw.colors : [])
    .filter((c: any) => c && typeof c === 'object')
    .map((c: any) => ({ name: String(c.name ?? 'color'), hex: String(c.hex ?? '#888888') }))
    .slice(0, 4);
  return {
    name: String(raw?.name || 'Prenda'),
    category: (VALID_CATS.has(raw?.category) ? raw.category : 'top') as Category,
    subtype: String(raw?.subtype ?? ''),
    material: String(raw?.material ?? ''),
    pattern: String(raw?.pattern ?? ''),
    fit: String(raw?.fit ?? ''),
    colors: colors.length ? colors : [{ name: 'gris', hex: '#888888' }],
    styles: (Array.isArray(raw?.styles) ? raw.styles : []).filter((s: any) => VALID_STYLES.has(s)),
    seasons: (Array.isArray(raw?.seasons) ? raw.seasons : []).map(String).slice(0, 4),
    description: String(raw?.description ?? ''),
  };
}

export function cleanOutfits(raw: any, validIds: Set<string>, style: string): OutfitSuggestion[] {
  let outs = raw?.outfits ?? [];
  if (!Array.isArray(outs)) outs = [outs];
  const clean: OutfitSuggestion[] = [];
  for (const o of outs) {
    const ids = (Array.isArray(o?.garment_ids) ? o.garment_ids : []).filter((i: any) =>
      validIds.has(i),
    );
    if (ids.length < 2) continue;
    clean.push({
      name: String(o?.name || 'Outfit'),
      style,
      garment_ids: ids,
      reason: String(o?.reason ?? ''),
      score: Math.max(1, Math.min(10, Number(o?.score) || 7)),
    });
  }
  return clean;
}

// ---------- Pollinations (texto) ----------

export async function pollinationsChat(
  content: string | { type: string; [k: string]: any }[],
  opts: { model?: string; timeoutMs?: number } = {},
): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 120_000);
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (POLLINATIONS_TOKEN) headers.Authorization = `Bearer ${POLLINATIONS_TOKEN}`;
    const res = await fetch(`${POLLINATIONS_TEXT}/openai`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: opts.model ?? 'openai',
        messages: [{ role: 'user', content }],
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`IA nube respondió ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    const msg = data?.choices?.[0]?.message?.content;
    if (typeof msg !== 'string') throw new Error('Respuesta de IA sin contenido');
    return msg;
  } finally {
    clearTimeout(timer);
  }
}

// ---------- Utilidades de imagen ----------

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

// ---------- Try-on generativo (Pollinations nanobanana / kontext) ----------

/**
 * Genera una foto del dueño con las prendas puestas, a partir de su foto real
 * (URL pública) y las prendas recortadas (URLs públicas). Devuelve un data URL.
 * La cara/identidad se preserva por instrucción explícita del prompt.
 */
export async function generateTryOnCore(
  personUrl: string,
  garments: Garment[],
  profile: Profile | null,
): Promise<string> {
  if (!HAS_TRYON) throw new Error(TRYON_HINT);

  const garmentUrls = garments
    .map((g) => g.cutout_url ?? g.image_url)
    .filter((u): u is string => !!u)
    .slice(0, 5);
  if (!garmentUrls.length) throw new Error('Selecciona al menos una prenda');

  const list = garments
    .map((g) => `${g.subtype || g.category}${g.colors?.[0] ? ` ${g.colors[0].name}` : ''} ("${g.name}")`)
    .join(', ');
  const body = profile?.height_cm
    ? ` The person is ${profile.height_cm} cm tall, ${profile.weight_kg ?? ''} kg.`
    : '';
  const prompt =
    `Virtual try-on fashion photo. The FIRST image is the person. Dress this exact person in the clothing items shown in the other images: ${list}.` +
    ` CRITICAL: keep the person's face, hair, skin tone, body shape and pose EXACTLY as in the first image — same identity, do not modify the face at all.${body}` +
    ` Full body shot, clean light-beige studio background, soft natural lighting, photorealistic, high detail.`;

  const images = [personUrl, ...garmentUrls];
  const errors: string[] = [];

  for (const model of ['nanobanana', 'kontext']) {
    const url =
      `${POLLINATIONS_IMAGE}/prompt/${encodeURIComponent(prompt)}` +
      `?model=${model}&image=${encodeURIComponent(images.join(','))}` +
      `&width=832&height=1248&nologo=true&private=true&seed=${Math.floor(Math.random() * 1e9)}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 300_000);
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${POLLINATIONS_TOKEN}` },
        signal: ctrl.signal,
      });
      if (!res.ok) {
        errors.push(`${model}: ${res.status} ${(await res.text()).slice(0, 150)}`);
        continue;
      }
      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) {
        errors.push(`${model}: respuesta no es imagen (${blob.type})`);
        continue;
      }
      return await blobToDataUrl(blob);
    } catch (e: any) {
      errors.push(`${model}: ${e?.message ?? e}`);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(`No se pudo generar la imagen. ${errors.join(' · ')}`);
}
