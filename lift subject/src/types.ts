/**
 * Core types for the cutout-style component extraction platform.
 */

export interface Region {
  x: number
  y: number
  width: number
  height: number
}

export interface ComponentModifications {
  preset?: { name: string; appliedAt: number }
  ai?: { prompt: string; result: string; intensity: number }
  replacement?: { source: string; position: Region }
}

/** Product variation from database (sofa/wall/door/window/chair/coffee_table/glass_partition) */
export interface ProductVariation {
  componentType: 'sofa' | 'wall' | 'door' | 'window' | 'chair' | 'coffee_table' | 'glass_partition'
  productCode: string
  variationCode: string
  color: string
  material: string
  texture: string
  finish: string
  size: string
}

export type ComponentType = 'sofa' | 'wall' | 'door' | 'window' | 'chair' | 'coffee_table' | 'glass_partition'

export interface DetectedComponent {
  id: string
  name: string
  /** Bounding box / position in the scene (same as region, for spec alignment) */
  region: Region
  confidence: number
  /** Current cutout image (original or modified). Used when compositing to the scene. */
  cutoutDataUrl: string | null
  /** Original cutout when first extracted. Kept per component for reset / isolation. */
  originalCutoutDataUrl?: string | null
  /** This component's mask only. Never use a global mask. */
  maskDataUrl: string | null
  isSelected: boolean
  modifications: ComponentModifications
  accentColor: string
  /** User-selected type so we show matching product variations */
  componentType?: ComponentType
  /** Applied product variation from database */
  appliedVariation?: ProductVariation
}

export interface ImageState {
  source: string | null
  file: File | null
  width: number
  height: number
  originalDataUrl: string | null
  /** Main canvas image: original with all component cutouts composited back. Updated when cutouts change. */
  displayDataUrl: string | null
}

export type ActivePanel = 'preset' | 'ai' | 'replace' | 'export' | null

export type PreviewMode = 'before' | 'after' | 'split'

export type InteractionMode = 'rectangle' | 'click' | 'hover' | 'auto' | 'material'

export interface SelectionState {
  activeComponentIds: string[]
  activePanel: ActivePanel
  previewMode: PreviewMode
  interactionMode: InteractionMode
}

export interface EditingState {
  isAnalyzing: boolean
  isExtracting: boolean
  isProcessing: boolean
  currentOperation: string
  progress: number
  /** Optional prompt for Grounding DINO (e.g. "sofa", "chair"). Empty = use default furniture prompt. */
  detectionPrompt?: string
}

export interface HistoryEntry {
  components: DetectedComponent[]
  image: ImageState
  timestamp: number
}

/** Temporary hover-only detection (DINO + SAM). Not in components[] until user clicks to select. */
export interface HoverDetectedComponent {
  id: string
  label: string
  boundingBox: Region
  maskDataUrl: string
}

export interface AppState {
  image: ImageState
  components: DetectedComponent[]
  /** Objects detected for hover mode (cleared when image or mode changes). */
  hoverDetected: HoverDetectedComponent[]
  selection: SelectionState
  editing: EditingState
  history: {
    undo: HistoryEntry[]
    redo: HistoryEntry[]
  }
}

export type PresetCategory = 'visual' | 'treatment' | 'background'

export interface PresetItem {
  id: string
  name: string
  description: string
  category: PresetCategory
  effect: Record<string, unknown>
}

export interface StockItem {
  id: string
  name: string
  category: string
  thumbnail: string
  colorTag?: string
  width: number
  height: number
}
