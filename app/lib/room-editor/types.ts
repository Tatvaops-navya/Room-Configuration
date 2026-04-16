/** Normalized rectangle (0–1) relative to image dimensions. */
export type BoundingBox = { x: number; y: number; width: number; height: number }

/** Selection type: object (click-detected) or area (user-drawn). */
export type SelectionType = 'object' | 'area'

export type EditorMode = 'idle' | 'edit' | 'add' | 'replace' | 'erase'

/** Lift Subject–style selection modes. */
export type SelectionMode = 'rectangle' | 'click' | 'hover' | 'auto'

export interface Selection {
  type: SelectionType
  /** Normalized bbox; for area, this is the drawn rect. For object, same. */
  boundingBox: BoundingBox
  /** Optional mask data URL (white = selected, black = keep). */
  maskDataUrl?: string
  /** For object: detected component type slug (e.g. "sofa", "coffee-table"). */
  objectType?: string
  /** Cutout on transparent bg (from SAM/extraction). When set, use compositing instead of inpainting. */
  cutoutDataUrl?: string
  /** Pixel region { x, y, width, height } when we have cutout (for compositing). */
  regionPx?: { x: number; y: number; width: number; height: number }
}

/** Edit tab: Preset (color/finish), AI (prompt), Replace (catalog/upload). */
export type EditTab = 'preset' | 'ai' | 'replace'

/** Catalog edit panel: browse by finish, color filter, or material filter. */
export type EditAttributeTab = 'style' | 'colour' | 'material' | 'ai'

/** Row from /api/product-variations (internal). */
export interface CatalogVariation {
  id: string
  label: string
  description?: string
  color?: string
  material?: string
  texture?: string
  finish?: string
  imageUrl?: string
}
