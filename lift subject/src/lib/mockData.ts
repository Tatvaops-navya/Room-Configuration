import type { PresetItem, StockItem } from '../types'

export const COMPONENT_NAMES = [
  'Floor', 'Wall', 'Chair', 'Light', 'Table', 'Sofa', 'Lamp', 'Plant', 'Rug',
  'Shelf', 'Painting', 'Window', 'Decor', 'Furniture', 'Area',
]

export const PRESETS: PresetItem[] = [
  { id: 'clean', name: 'Clean Polish', description: 'Enhance colors, increase clarity', category: 'visual', effect: {} },
  { id: 'vintage', name: 'Vintage Fade', description: 'Desaturate, add sepia tone', category: 'visual', effect: {} },
  { id: 'neon', name: 'Neon Pop', description: 'Saturate colors, add glow', category: 'visual', effect: {} },
  { id: 'grayscale', name: 'Artistic Sketch', description: 'Convert to sketch/line art style', category: 'visual', effect: {} },
  { id: 'studio', name: 'Studio Light', description: 'Professional lighting effect', category: 'visual', effect: {} },
  { id: 'watercolor', name: 'Watercolor', description: 'Watercolor painting effect', category: 'visual', effect: {} },
  { id: 'shadow', name: 'Expand Shadow', description: 'Large drop shadow for depth', category: 'treatment', effect: {} },
  { id: 'glow', name: 'Soft Glow', description: 'Soft outer glow around edges', category: 'treatment', effect: {} },
  { id: 'border', name: 'Border Frame', description: 'Decorative border/frame', category: 'treatment', effect: {} },
  { id: 'gold', name: 'Gold Trim', description: 'Gold/metallic border', category: 'treatment', effect: {} },
  { id: 'transparent', name: 'Transparent', description: 'Keep transparent background', category: 'background', effect: {} },
  { id: 'white', name: 'White', description: 'White background', category: 'background', effect: {} },
  { id: 'black', name: 'Black', description: 'Black background', category: 'background', effect: {} },
  { id: 'gradient-warm', name: 'Gradient - Warm', description: 'Warm gradient background', category: 'background', effect: {} },
  { id: 'gradient-cool', name: 'Gradient - Cool', description: 'Cool gradient background', category: 'background', effect: {} },
]

export const STOCK_ITEMS: StockItem[] = [
  { id: 's1', name: 'Modern Sofa', category: 'Furniture', thumbnail: '', width: 400, height: 280 },
  { id: 's2', name: 'Leather Chair', category: 'Furniture', thumbnail: '', width: 200, height: 220 },
  { id: 's3', name: 'Glass Table', category: 'Furniture', thumbnail: '', width: 320, height: 180 },
  { id: 's4', name: 'Abstract Art', category: 'Decor', thumbnail: '', width: 240, height: 300 },
  { id: 's5', name: 'Minimal Lamp', category: 'Lighting', thumbnail: '', width: 120, height: 280 },
  { id: 's6', name: 'Wooden Shelf', category: 'Furniture', thumbnail: '', width: 280, height: 160 },
  { id: 's7', name: 'Velvet Sofa', category: 'Furniture', thumbnail: '', width: 380, height: 260 },
  { id: 's8', name: 'Metal Chair', category: 'Furniture', thumbnail: '', width: 180, height: 200 },
]

export const AI_PLACEHOLDERS = [
  'Make it look more premium/luxury',
  'Change color to rose gold',
  'Apply a retro 1970s style',
  'Make it look like it\'s made of marble',
  'Add professional studio lighting',
  'Transform into a cartoon version',
  'Apply a cyberpunk aesthetic',
  'Make it look photorealistic',
]
