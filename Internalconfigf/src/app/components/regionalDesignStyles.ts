/** Regional design styles for the wizard Style Selection step (labels + API-facing names + thumbnails). */

export type RegionalStyleCategoryId = 'indian' | 'western' | 'middle-eastern' | 'eastern'

export const REGIONAL_STYLE_TABS: { id: RegionalStyleCategoryId; label: string }[] = [
  { id: 'indian', label: 'Indian' },
  { id: 'western', label: 'Western' },
  { id: 'middle-eastern', label: 'Middle Eastern' },
  { id: 'eastern', label: 'Eastern' },
]

export type RegionalStyleEntry = {
  id: string
  name: string
  category: RegionalStyleCategoryId
  /** Thumbnail for circular style picker */
  img: string
  /** Optional gradient for compact previews (e.g. GenerationResults) */
  gradient: string
}

const q = 'w=400&q=80'

export const REGIONAL_STYLES: RegionalStyleEntry[] = [
  // Indian
  {
    id: 'kerala',
    name: 'Kerala',
    category: 'indian',
    /** Nadumuttam / wooden pillars, warm light, oonjal — user-provided asset */
    img: '/regional-styles/kerala-style-thumb.png',
    gradient: 'linear-gradient(135deg, #4a3020 0%, #c4782c 40%, #f4d9a0 100%)',
  },
  {
    id: 'goan',
    name: 'Goan',
    category: 'indian',
    /** Coastal Portuguese-Indian, mint accents, patterned floor — user-provided asset */
    img: '/regional-styles/goan-style-thumb.png',
    gradient: 'linear-gradient(135deg, #1e4d4a 0%, #7ec8b8 35%, #f5ecd7 100%)',
  },
  {
    id: 'rajasthani',
    name: 'Rajasthani',
    category: 'indian',
    /** Royal haveli, scalloped arches, jhoola, frescoes — user-provided asset */
    img: '/regional-styles/rajasthani-style-thumb.png',
    gradient: 'linear-gradient(135deg, #1e5a8a 0%, #8b1538 45%, #c9a227 100%)',
  },
  {
    id: 'indian-contemporary',
    name: 'Indian Contemporary',
    category: 'indian',
    /** Clean modern, soft neutrals & sage, minimal luxe — user-provided asset */
    img: '/regional-styles/indian-contemporary-style-thumb.png',
    gradient: 'linear-gradient(135deg, #e8e4dc 0%, #9caf9c 40%, #d4c4a8 100%)',
  },
  {
    id: 'indian-modern',
    name: 'Indian Modern',
    category: 'indian',
    /** Neutral palette, sleek L-shape & media wall, premium finishes — user-provided asset */
    img: '/regional-styles/indian-modern-style-thumb.png',
    gradient: 'linear-gradient(135deg, #e8e6e1 0%, #b8b5ad 35%, #f0c14b 90%)',
  },
  {
    id: 'jammu',
    name: 'Jammu / North Indian',
    category: 'indian',
    /** Stone arches, jali, heavy wood table, warm lamps & rug — user-provided asset */
    img: '/regional-styles/jammu-style-thumb.png',
    gradient: 'linear-gradient(135deg, #4a3f35 0%, #c9a86c 45%, #8b2500 100%)',
  },
  {
    id: 'bengali',
    name: 'Bengali',
    category: 'indian',
    /** Pale walls + teak/cane, folk art, vintage elegance — user-provided asset */
    img: '/regional-styles/bengali-style-thumb.png',
    gradient: 'linear-gradient(135deg, #f5f0e0 0%, #c4a574 40%, #5c4033 100%)',
  },
  {
    id: 'gujarati',
    name: 'Gujarati',
    category: 'indian',
    /** Kutch textiles, abhla work, carved wood, vivid patchwork — user-provided asset */
    img: '/regional-styles/gujarati-style-thumb.png',
    gradient: 'linear-gradient(135deg, #e91e63 0%, #26a69a 40%, #ffca28 100%)',
  },
  {
    id: 'odisha',
    name: 'Odisha',
    category: 'indian',
    /** Pattachitra motifs, ikat textiles, temple-inspired carved details */
    img: '/api/regional-style-image/odisha',
    gradient: 'linear-gradient(135deg, #8b2500 0%, #d4a017 45%, #f3dfb2 100%)',
  },
  {
    id: 'maharashtrian',
    name: 'Maharashtrian',
    category: 'indian',
    /** Wada-inspired woodwork, earthy tones, brass accents, Paithani highlights */
    img: '/api/regional-style-image/maharashtrian',
    gradient: 'linear-gradient(135deg, #5b2c1d 0%, #c26a2f 45%, #e8c57a 100%)',
  },
  {
    id: 'punjabi',
    name: 'Punjabi',
    category: 'indian',
    /** Phulkari-inspired colors, robust wood furniture, lively handcrafted decor */
    img: '/api/regional-style-image/punjabi',
    gradient: 'linear-gradient(135deg, #7a1f2b 0%, #d68a2f 45%, #f4d35e 100%)',
  },
  {
    id: 'south-indian',
    name: 'South Indian (generic)',
    category: 'indian',
    /** Marble floors, dark wood, planter chairs, jhoola, brass — user-provided asset */
    img: '/regional-styles/south-indian-style-thumb.png',
    gradient: 'linear-gradient(135deg, #f5f2eb 0%, #c9a227 35%, #3d2914 100%)',
  },
  // Western
  {
    id: 'us',
    name: 'US',
    category: 'western',
    img: `https://images.unsplash.com/photo-1600210491369-e753d80a41f3?${q}`,
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #4a6b8a 50%, #c4c4c4 100%)',
  },
  {
    id: 'latin-american',
    name: 'Latin American',
    category: 'western',
    img: '/api/regional-style-image/latin-american',
    gradient: 'linear-gradient(135deg, #c45c26 0%, #2d8b57 50%, #f4d03f 100%)',
  },
  {
    id: 'european',
    name: 'European',
    category: 'western',
    img: `https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?${q}`,
    gradient: 'linear-gradient(135deg, #3d3d3d 0%, #c9b896 50%, #6b5344 100%)',
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian',
    category: 'western',
    img: `https://images.unsplash.com/photo-1632489752865-28346e16cd85?${q}`,
    gradient: 'linear-gradient(135deg, #f5f5f5 0%, #c0d8e4 100%)',
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    category: 'western',
    img: `https://images.unsplash.com/photo-1760681554315-18de6eaa065f?${q}`,
    gradient: 'linear-gradient(135deg, #e8d5b7 0%, #2e7bba 100%)',
  },
  {
    id: 'french',
    name: 'French',
    category: 'western',
    img: `https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?${q}`,
    gradient: 'linear-gradient(135deg, #2c2c2c 0%, #d4c4b0 50%, #8b7355 100%)',
  },
  {
    id: 'italian',
    name: 'Italian',
    category: 'western',
    img: `https://images.unsplash.com/photo-1617806118233-18e1de247200?${q}`,
    gradient: 'linear-gradient(135deg, #8b0000 0%, #c9a227 50%, #2d5016 100%)',
  },
  {
    id: 'industrial',
    name: 'Industrial Loft',
    category: 'western',
    img: '/api/regional-style-image/industrial',
    gradient: 'linear-gradient(135deg, #2f2f2f 0%, #7a6a5f 50%, #bfa58a 100%)',
  },
  // Middle Eastern
  {
    id: 'turkish',
    name: 'Turkish',
    category: 'middle-eastern',
    img: '/api/regional-style-image/turkish',
    gradient: 'linear-gradient(135deg, #1a252f 0%, #c9a227 50%, #8b2500 100%)',
  },
  {
    id: 'moroccan',
    name: 'Moroccan',
    category: 'middle-eastern',
    img: '/api/regional-style-image/moroccan',
    gradient: 'linear-gradient(135deg, #0d3b2c 0%, #c9a227 50%, #8b2500 100%)',
  },
  {
    id: 'persian',
    name: 'Persian',
    category: 'middle-eastern',
    /** Deep cultural identity with refined, detailed ornamental pattern language */
    img: '/api/regional-style-image/persian',
    gradient: 'linear-gradient(135deg, #4b1f2d 0%, #b8860b 45%, #1f3a5a 100%)',
  },
  {
    id: 'omani',
    name: 'Omani',
    category: 'middle-eastern',
    /** Clean, airy expression with understated traditional detailing to balance heavier regional looks */
    img: '/api/regional-style-image/omani',
    gradient: 'linear-gradient(135deg, #f1e6d2 0%, #d2b48c 45%, #8c6b4f 100%)',
  },
  {
    id: 'lebanese',
    name: 'Lebanese',
    category: 'middle-eastern',
    /** Premium modern fusion of European refinement and Arabic character */
    img: '/api/regional-style-image/lebanese',
    gradient: 'linear-gradient(135deg, #f3f4f6 0%, #6fa3c8 45%, #5b4636 100%)',
  },
  {
    id: 'egyptian',
    name: 'Egyptian',
    category: 'middle-eastern',
    /** Strong visual identity with iconic motifs and statement detailing */
    img: '/api/regional-style-image/egyptian',
    gradient: 'linear-gradient(135deg, #c8b38a 0%, #d4af37 45%, #6d5b4b 100%)',
  },
  {
    id: 'arabian',
    name: 'Arabian (Dubai, Qatar)',
    category: 'middle-eastern',
    img: `https://images.unsplash.com/photo-1613490493576-7fde63acd811?${q}`,
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #d4af37 50%, #f5f5f5 100%)',
  },
  {
    id: 'monaco',
    name: 'Monaco',
    category: 'middle-eastern',
    img: `https://images.unsplash.com/photo-1615873968403-89e068629265?${q}`,
    gradient: 'linear-gradient(135deg, #0f1419 0%, #c0c0c0 50%, #1e3a5f 100%)',
  },
  // Eastern
  {
    id: 'japanese',
    name: 'Japanese',
    category: 'eastern',
    img: `https://images.unsplash.com/photo-1764445274424-47bbc216073b?${q}`,
    gradient: 'linear-gradient(135deg, #2c2416 0%, #8b7355 50%, #e8e0d5 100%)',
  },
  {
    id: 'chinese',
    name: 'Chinese',
    category: 'eastern',
    img: '/api/regional-style-image/chinese',
    gradient: 'linear-gradient(135deg, #8b0000 0%, #d4af37 50%, #1a1a1a 100%)',
  },
  {
    id: 'zen',
    name: 'Zen / Minimal Eastern',
    category: 'eastern',
    img: `https://images.unsplash.com/photo-1771030666262-01563b193f0f?${q}`,
    gradient: 'linear-gradient(135deg, #e8e8e8 0%, #6b8e6b 50%, #3d4f3d 100%)',
  },
  {
    id: 'korean',
    name: 'Korean',
    category: 'eastern',
    /** Clean contemporary Korean interiors with warm woods and soft minimal detailing */
    img: '/api/regional-style-image/korean?v=20260420',
    gradient: 'linear-gradient(135deg, #f2eee8 0%, #d9c7b3 45%, #8a7768 100%)',
  },
  {
    id: 'thai',
    name: 'Thai',
    category: 'eastern',
    /** Tropical elegance, carved wood accents, airy indoor-outdoor mood */
    img: `https://images.unsplash.com/photo-1540518614846-7eded433c457?${q}`,
    gradient: 'linear-gradient(135deg, #2f4f3e 0%, #b58e5a 45%, #f1e2c8 100%)',
  },
  {
    id: 'balinese',
    name: 'Balinese',
    category: 'eastern',
    /** Resort-like calm with natural textures, stone, timber, and greenery */
    img: `https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?${q}`,
    gradient: 'linear-gradient(135deg, #3a4a3f 0%, #8b6a4e 45%, #d8c3a5 100%)',
  },
  {
    id: 'vietnamese',
    name: 'Vietnamese',
    category: 'eastern',
    /** Tropical-modern balance with timber tones, light plaster, and clean lines */
    img: `https://images.unsplash.com/photo-1616046229478-9901c5536a45?${q}`,
    gradient: 'linear-gradient(135deg, #f1e6d6 0%, #b88c5a 45%, #4f6b56 100%)',
  },
  {
    id: 'asian-contemporary',
    name: 'Asian Contemporary',
    category: 'eastern',
    /** Modern pan-Asian style with elegant textures and uncluttered composition */
    img: `https://images.unsplash.com/photo-1618220179428-22790b461013?${q}`,
    gradient: 'linear-gradient(135deg, #ddd7cd 0%, #9e8f7f 45%, #3e4f56 100%)',
  },
]

export const DEFAULT_REGIONAL_STYLE_NAME = REGIONAL_STYLES[0]?.name ?? 'Kerala'

export function regionalStyleByName(name: string): RegionalStyleEntry | undefined {
  return REGIONAL_STYLES.find((s) => s.name === name)
}
