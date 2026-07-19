export type Category = 'top' | 'bottom' | 'outerwear' | 'dress' | 'shoes' | 'accessory';

export const CATEGORIES: { key: Category; label: string; emoji: string }[] = [
  { key: 'top', label: 'Superior', emoji: '👕' },
  { key: 'bottom', label: 'Inferior', emoji: '👖' },
  { key: 'outerwear', label: 'Abrigo', emoji: '🧥' },
  { key: 'dress', label: 'Vestido', emoji: '👗' },
  { key: 'shoes', label: 'Calzado', emoji: '👟' },
  { key: 'accessory', label: 'Accesorio', emoji: '🕶️' },
];

export const STYLES: { key: string; label: string }[] = [
  { key: 'casual', label: 'Casual' },
  { key: 'formal', label: 'Formal' },
  { key: 'semiformal', label: 'Semiformal' },
  { key: 'estetico', label: 'Estético' },
  { key: 'old_money', label: 'Old Money' },
  { key: 'streetwear', label: 'Streetwear' },
  { key: 'deportivo', label: 'Deportivo' },
];

export const styleLabel = (key: string) =>
  STYLES.find((s) => s.key === key)?.label ?? key;

export const categoryLabel = (key: string) =>
  CATEGORIES.find((c) => c.key === key)?.label ?? key;

export interface GarmentColor {
  name: string;
  hex: string;
}

export interface GarmentAnalysis {
  name: string;
  category: Category;
  subtype: string;
  material: string;
  pattern: string;
  fit: string;
  colors: GarmentColor[];
  styles: string[];
  seasons: string[];
  description: string;
}

export interface Garment {
  id: string;
  user_id: string;
  name: string;
  category: Category;
  subtype: string | null;
  material: string | null;
  pattern: string | null;
  fit: string | null;
  colors: GarmentColor[];
  styles: string[];
  seasons: string[];
  description: string | null;
  image_url: string | null;
  cutout_url: string | null;
  created_at: string;
}

export interface Outfit {
  id: string;
  user_id: string;
  name: string;
  style: string;
  reason: string | null;
  garment_ids: string[];
  score: number | null;
  created_at: string;
}

export interface OutfitSuggestion {
  name: string;
  style: string;
  reason: string;
  garment_ids: string[];
  score: number;
}

export interface Profile {
  id: string;
  display_name: string | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  shirt_size: string | null;
  pants_size: string | null;
  shoe_size: string | null;
}
