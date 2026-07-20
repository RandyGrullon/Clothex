import { decode } from 'base64-arraybuffer';

import { supabase } from './supabase';
import type {
  Garment,
  GarmentAnalysis,
  ModelAngle,
  Outfit,
  OutfitSuggestion,
  Profile,
} from './types';

// ---------- Perfil ----------

export async function upsertProfile(p: Partial<Profile> & { id: string }) {
  const { error } = await supabase.from('profiles').upsert(p);
  if (error) throw error;
}

/** Sube una foto (ya recortada) del dueño para un ángulo y guarda la URL. */
export async function saveModelPhoto(
  userId: string,
  angle: ModelAngle,
  cutoutB64: string,
): Promise<string> {
  const url = await uploadImage(userId, cutoutB64, `model-${angle}.png`, 'image/png');
  const column =
    angle === 'front' ? 'model_front_url' : angle === 'side' ? 'model_side_url' : 'model_back_url';
  const { error } = await supabase.from('profiles').upsert({ id: userId, [column]: url });
  if (error) throw error;
  return url;
}

/** Guarda una foto de try-on generada (data URL) y devuelve su URL pública. */
export async function saveTryonImage(userId: string, dataUrl: string): Promise<string> {
  const [meta, b64] = dataUrl.split(',');
  if (!b64) throw new Error('Imagen generada inválida');
  const contentType = meta.match(/^data:(.*?)(;|$)/)?.[1] || 'image/png';
  const ext = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png';
  return uploadImage(userId, b64, `tryon.${ext}`, contentType);
}

// ---------- Storage ----------

async function uploadImage(userId: string, b64: string, suffix: string, contentType: string) {
  const path = `${userId}/${Date.now()}-${suffix}`;
  const { error } = await supabase.storage
    .from('garments')
    .upload(path, decode(b64), { contentType, upsert: false });
  if (error) throw error;
  return supabase.storage.from('garments').getPublicUrl(path).data.publicUrl;
}

// ---------- Prendas ----------

export async function listGarments(): Promise<Garment[]> {
  const { data, error } = await supabase
    .from('garments')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Garment[];
}

export async function getGarment(id: string): Promise<Garment | null> {
  const { data, error } = await supabase.from('garments').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as Garment) ?? null;
}

export async function addGarment(
  userId: string,
  originalB64: string,
  cutoutB64: string,
  a: GarmentAnalysis,
): Promise<Garment> {
  const [imageUrl, cutoutUrl] = await Promise.all([
    uploadImage(userId, originalB64, 'original.jpg', 'image/jpeg'),
    uploadImage(userId, cutoutB64, 'cutout.png', 'image/png'),
  ]);
  const row = {
    user_id: userId,
    name: a.name,
    category: a.category,
    subtype: a.subtype,
    material: a.material,
    pattern: a.pattern,
    fit: a.fit,
    colors: a.colors,
    styles: a.styles,
    seasons: a.seasons,
    description: a.description,
    image_url: imageUrl,
    cutout_url: cutoutUrl,
  };
  const { data, error } = await supabase.from('garments').insert(row).select().single();
  if (error) throw error;
  return data as Garment;
}

export async function deleteGarment(id: string) {
  const { error } = await supabase.from('garments').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Outfits ----------

export async function listOutfits(): Promise<Outfit[]> {
  const { data, error } = await supabase
    .from('outfits')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Outfit[];
}

export async function getOutfit(id: string): Promise<Outfit | null> {
  const { data, error } = await supabase.from('outfits').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as Outfit) ?? null;
}

export async function saveOutfit(userId: string, s: OutfitSuggestion): Promise<Outfit> {
  const { data, error } = await supabase
    .from('outfits')
    .insert({
      user_id: userId,
      name: s.name,
      style: s.style,
      reason: s.reason,
      garment_ids: s.garment_ids,
      score: s.score,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Outfit;
}

export async function deleteOutfit(id: string) {
  const { error } = await supabase.from('outfits').delete().eq('id', id);
  if (error) throw error;
}
