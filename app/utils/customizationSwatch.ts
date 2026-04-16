/** Map common color names to hex for swatches (from style names and API color names). */
const COLOR_NAME_TO_HEX: Record<string, string> = {
  // --- Single words from product_variations.color (external / internal catalogs) ---
  beige: '#D4C4A8',
  grey: '#8E9298',
  gray: '#8E9298',
  sand: '#D4C4A0',
  brown: '#6B4423',
  blue: '#4F8FE8',
  green: '#2D9E5E',
  black: '#1a1a1a',
  white: '#FFFFFF',
  silver: '#B8BCC4',
  gold: '#D4A844',
  clear: '#E8F4FC',
  warm: '#FFF4E0',
  cool: '#E8F0FF',
  cement: '#A8A8A8',
  glass: '#C8DFF0',
  multi: '#C4B5FD',
  red: '#C62828',
  yellow: '#F5D547',
  orange: '#E67E22',
  pink: '#ECA8B5',
  purple: '#7E57C2',
  tan: '#C8A882',
  navy: '#1E3A5F',
  bronze: '#8B6914',
  copper: '#B87333',

  // --- Multi-word & phrases (DB + labels) ---
  'beige grey': '#A89B8E',
  'beige gray': '#A89B8E',
  'dark walnut': '#5C3A21',
  'warm white': '#f5f5dc',
  'sage green': '#9dc183',
  terracotta: '#c47244',
  'charcoal grey': '#36454f',
  'charcoal gray': '#36454f',
  'beige linen': '#e8dcc4',
  'navy blue': '#000080',
  'light beige': '#e8dcc4',
  'slate gray': '#708090',
  'slate grey': '#708090',
  'dark charcoal': '#36454f',
  'warm taupe': '#b38b6d',
  'matte black': '#282828',
  'pure white': '#fafafa',
  'silver grey': '#c0c0c0',
  'silver gray': '#c0c0c0',
  'walnut brown': '#5c4033',
  'oak natural': '#c4a574',
  'white matte': '#f5f5f5',
  'warm beige': '#E3D9C6',
  'soft white': '#F5F5F5',
  sandstone: '#D8D1C5',
  concrete: '#BEBEBE',
  walnut: '#7A5230',
  'walnut wood': '#7A5230',
  oak: '#C79A6B',
  'oak wood': '#C79A6B',
  'grey slate': '#9A9A9A',
  'gray slate': '#9A9A9A',
  'dark granite': '#4B4B4B',
  ivory: '#E6D8B5',
  'urban concrete': '#AFAFAF',
  travertine: '#D2C2A8',
  teak: '#B38B5E',
  'light grey': '#ECECEC',
  'light gray': '#ECECEC',
  'off white': '#F0EFEA',
  charcoal: '#6F6F6F',
  'natural stone': '#B7A28A',
  'minimal concrete': '#DADADA',
  'rustic wood': '#9B6F4A',
  'stone grey': '#C4C4C4',
  'stone gray': '#C4C4C4',
  'industrial cement': '#8E8E8E',
  cream: '#E1D4C4',
  'beige stone': '#DCD0B0',
  'modern grey': '#9E9E9E',
  'modern gray': '#9E9E9E',
  'soft cream': '#EFE6D8',
  'sky blue': '#87CEEB',
  'pastel blue': '#93C5FD',
  'pastel green': '#86EFAC',
  'marble white': '#F5F5F0',
}

const HEX_REGEX = /^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/

const UNKNOWN_SWATCH = '#cbd5e1'

/** Resolve a color name phrase to hex, or undefined if unknown (no random hash). */
function tryResolveNamedColor(input: string): string | undefined {
  const key = input.toLowerCase().trim().replace(/\s+/g, ' ')
  if (!key) return undefined
  if (COLOR_NAME_TO_HEX[key]) return COLOR_NAME_TO_HEX[key]
  const words = key.split(' ').filter(Boolean)
  for (let len = Math.min(4, words.length); len >= 1; len--) {
    for (let i = words.length - len; i >= 0; i--) {
      const phrase = words.slice(i, i + len).join(' ')
      const hex = COLOR_NAME_TO_HEX[phrase]
      if (hex) return hex
    }
  }
  return undefined
}

export function colorNameToHex(name: string): string {
  if (!name?.trim()) return UNKNOWN_SWATCH
  return tryResolveNamedColor(name) ?? UNKNOWN_SWATCH
}

/** Hex from option.color or inferred from label (e.g. "Matte Paint - Beige" → beige swatch). */
export function swatchHexFromOption(opt: { color?: string; label?: string }): string {
  const raw = (opt.color ?? '').trim()
  if (HEX_REGEX.test(raw)) return raw
  if (/^[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(raw)) return `#${raw}`
  if (raw) {
    const fromColor = tryResolveNamedColor(raw)
    if (fromColor) return fromColor
  }
  const label = (opt.label ?? '').trim()
  if (!label) return UNKNOWN_SWATCH

  // Prefer segments after " - " / en-dash (variation names from DB: "Matte Paint - Beige")
  const segments = label.split(/\s*[-–—]\s*/).map((s) => s.trim()).filter(Boolean)
  for (let s = segments.length - 1; s >= 0; s--) {
    const hex = tryResolveNamedColor(segments[s]!)
    if (hex) return hex
  }

  // Whole label (multi-word phrases in map)
  const whole = tryResolveNamedColor(label)
  if (whole) return whole

  // Strip stray hyphens from tokenization, then sliding window on words
  const words = label
    .toLowerCase()
    .replace(/[-–—]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0 && /^[a-z]+$/.test(w))
  for (let len = Math.min(4, words.length); len >= 1; len--) {
    for (let i = words.length - len; i >= 0; i--) {
      const phrase = words.slice(i, i + len).join(' ')
      const hex = COLOR_NAME_TO_HEX[phrase]
      if (hex) return hex
    }
  }

  return UNKNOWN_SWATCH
}
