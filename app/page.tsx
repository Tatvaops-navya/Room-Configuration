'use client'

import { useState, useEffect, useCallback } from 'react'
import ImageUpload from './components/ImageUpload'
import ConfigurationSelector, { type DetectedComponent } from './components/ConfigurationSelector'
import ComponentReferenceUpload from './components/ComponentReferenceUpload'
import FullRoomReferenceUpload from './components/FullRoomReferenceUpload'
import VastuQuestionnaire, {
  type VastuPreferences,
  type VastuStrictness,
  type VastuRoomType,
} from './components/VastuQuestionnaire'
import StyleSelector from './components/StyleSelector'
import ColorPaletteSelector from './components/ColorPaletteSelector'
import BeforeAfterSlider from './components/BeforeAfterSlider'
import {
  type ExternalCategory,
  type ExternalCustomizationState,
  EXTERNAL_CATEGORIES,
  EXTERNAL_CATEGORY_LABELS,
  EXTERNAL_CUSTOMIZATION_PRESETS,
  getInitialExternalCustomization,
} from './utils/externalCustomizationPresets'
import { downloadImageWithLogo, applyWatermarkToImage } from './utils/downloadWithLogo'

/** Parse response as JSON; if body is plain text (e.g. "An error occurred"), avoid "is not valid JSON" throw. */
async function parseJsonOrText<T = unknown>(res: Response): Promise<T> {
  const text = await res.text()
  try {
    return JSON.parse(text) as T
  } catch {
    if (!res.ok) throw new Error(text || res.statusText || 'Request failed')
    throw new Error('Invalid response from server')
  }
}

// Map external UI category to API component (product_variations table)
const EXTERNAL_CATEGORY_TO_COMPONENT: Record<ExternalCategory, string> = {
  facade: 'facade',
  windows: 'window',
  entrance: 'door',
  balcony: 'balcony',
  lighting: 'lighting',
  landscape: 'landscaping',
  flooring: 'pathway',
  architectural: 'facade',
}

/** Configuration type: internal (room), external (house/facade), or standalone Vastu-based. */
export type ConfigType = 'internal' | 'external' | 'vastu' | null

type CustomElementType =
  | 'wall'
  | 'floor'
  | 'ceiling'
  | 'sofa'
  | 'chair'
  | 'desk'
  | 'table'
  | 'cabinet'
  | 'door'
  | 'window'
  | 'glass-partition'
  | 'decor'

const CUSTOMIZATION_LIBRARY: Record<
  CustomElementType,
  { id: string; label: string; description: string }[]
> = {
  wall: [
    { id: 'wall_paint_warm_white', label: 'Warm white paint', description: 'Soft warm white painted wall finish.' },
    { id: 'wall_texture_concrete', label: 'Concrete texture', description: 'Smooth light concrete wall texture.' },
    { id: 'wall_panel_walnut', label: 'Walnut wood panels', description: 'Vertical walnut wood panel cladding.' },
  ],
  floor: [
    { id: 'floor_tile_beige', label: 'Beige tiles', description: 'Polished beige ceramic tiles.' },
    { id: 'floor_wood_oak', label: 'Oak wood', description: 'Natural oak wood flooring.' },
    { id: 'floor_marble_light', label: 'Light marble', description: 'Light cream marble floor finish.' },
  ],
  ceiling: [
    { id: 'ceiling_white_plain', label: 'Plain white', description: 'Simple flat white painted ceiling.' },
    { id: 'ceiling_wood_beams', label: 'Wood beams', description: 'Decorative wooden ceiling beams.' },
    { id: 'ceiling_cove_lighting', label: 'Cove lighting', description: 'Soft cove lighting around the ceiling perimeter.' },
  ],
  sofa: [
    { id: 'sofa_fabric_grey', label: 'Grey fabric', description: 'Neutral grey fabric upholstery.' },
    { id: 'sofa_fabric_blue', label: 'Blue fabric', description: 'Soft blue fabric upholstery.' },
    { id: 'sofa_leather_tan', label: 'Tan leather', description: 'Warm tan leather upholstery.' },
  ],
  chair: [
    { id: 'chair_black_mesh', label: 'Black mesh', description: 'Black mesh office chair finish.' },
    { id: 'chair_fabric_grey', label: 'Grey fabric', description: 'Grey upholstered chair.' },
    { id: 'chair_wood_frame', label: 'Wooden frame', description: 'Chair with exposed wooden frame.' },
  ],
  desk: [
    { id: 'desk_wood_walnut', label: 'Walnut desk', description: 'Walnut wood desk finish.' },
    { id: 'desk_white_top', label: 'White top', description: 'Matte white worktop with wood base.' },
  ],
  table: [
    { id: 'table_wood_light', label: 'Light wood', description: 'Light wood coffee/side tables.' },
    { id: 'table_glass_top', label: 'Glass top', description: 'Glass top with minimal base.' },
  ],
  cabinet: [
    { id: 'cabinet_wood_warm', label: 'Warm wood', description: 'Warm wood storage cabinet fronts.' },
    { id: 'cabinet_white_flat', label: 'White flat panels', description: 'Flat white cabinet fronts.' },
  ],
  door: [
    { id: 'door_wood_rich', label: 'Rich wood', description: 'Rich brown wooden door finish.' },
    { id: 'door_white_minimal', label: 'White minimal', description: 'Minimal white painted door.' },
    { id: 'door_black_hardware', label: 'Black hardware', description: 'Black metal handles and hinges.' },
  ],
  window: [
    { id: 'window_black_frame', label: 'Black frame', description: 'Black aluminium window frames.' },
    { id: 'window_wood_frame', label: 'Wood frame', description: 'Timber window framing.' },
  ],
  'glass-partition': [
    { id: 'glass_clear', label: 'Clear glass', description: 'Clear frameless glass partition.' },
    { id: 'glass_frosted', label: 'Frosted glass', description: 'Frosted privacy glass partition.' },
  ],
  decor: [
    { id: 'decor_plants_green', label: 'Green plants', description: 'Add more indoor plants in key corners.' },
    { id: 'decor_art_warm', label: 'Warm art frames', description: 'Warm-toned artwork and frames.' },
    { id: 'decor_lamps_warm', label: 'Warm lamps', description: 'Warm white floor and table lamps.' },
  ],
}

/** Map common color names to hex for table swatches (from style names and API color names) */
const COLOR_NAME_TO_HEX: Record<string, string> = {
  'warm white': '#f5f5dc',
  'sage green': '#9dc183',
  terracotta: '#c47244',
  'charcoal grey': '#36454f',
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
  'walnut brown': '#5c4033',
  'oak natural': '#c4a574',
  'white matte': '#f5f5f5',
  // Floor / material style names (match start of style_name)
  'warm beige': '#E3D9C6',
  'soft white': '#F5F5F5',
  sandstone: '#D8D1C5',
  concrete: '#BEBEBE',
  walnut: '#7A5230',
  'walnut wood': '#7A5230',
  oak: '#C79A6B',
  'oak wood': '#C79A6B',
  white: '#FFFFFF',
  'grey slate': '#9A9A9A',
  'dark granite': '#4B4B4B',
  ivory: '#E6D8B5',
  'urban concrete': '#AFAFAF',
  travertine: '#D2C2A8',
  teak: '#B38B5E',
  'light grey': '#ECECEC',
  'off white': '#F0EFEA',
  charcoal: '#6F6F6F',
  'natural stone': '#B7A28A',
  'minimal concrete': '#DADADA',
  'rustic wood': '#9B6F4A',
  'stone grey': '#C4C4C4',
  'industrial cement': '#8E8E8E',
  cream: '#E1D4C4',
  'dark walnut': '#5C3A21',
  'beige stone': '#DCD0B0',
  'modern grey': '#9E9E9E',
  'soft cream': '#EFE6D8',
}
const HEX_REGEX = /^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/
function colorNameToHex(name: string): string {
  if (!name?.trim()) return '#e5e7eb'
  const key = name.toLowerCase().trim()
  const found = COLOR_NAME_TO_HEX[key]
  if (found) return found
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash + key.charCodeAt(i)) % 0xffffff
  return '#' + (hash.toString(16).padStart(6, '0'))
}
/** Extract color phrase from start of style name and return hex (e.g. "Warm Beige Tile Smooth" -> warm beige -> #E3D9C6) */
function swatchHexFromOption(opt: { color?: string; label?: string }): string {
  const raw = (opt.color ?? '').trim()
  if (HEX_REGEX.test(raw)) return raw
  if (raw) return colorNameToHex(raw)
  const label = (opt.label ?? '').trim()
  if (!label) return '#e5e7eb'
  const words = label.split(/\s+/)
  for (let len = Math.min(words.length, 4); len >= 1; len--) {
    const phrase = words.slice(0, len).join(' ').toLowerCase()
    const hex = COLOR_NAME_TO_HEX[phrase]
    if (hex) return hex
  }
  return '#e5e7eb'
}

/**
 * Main page component for the AI Room Configuration System
 * Flow: Step 1 = Select Configuration Type (Internal/External) → Upload → AI Detection → Config Mode → Generate
 */
export default function Home() {
  // Step 1: Configuration type (must select before upload)
  const [configType, setConfigType] = useState<ConfigType>(null)

  // State for uploaded images (base64 strings)
  const [images, setImages] = useState<string[]>([])
  
  // State for configuration mode: 'purpose' | 'arrangement' (internal) or same for external
  const [configMode, setConfigMode] = useState<'purpose' | 'arrangement'>('purpose')

  // Style selection (Step 4): applied to both interior and exterior flows
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [selectedColorPalette, setSelectedColorPalette] = useState<string | null>(null)
  
  // State for Full Room Configuration: reference image(s) and single combined text (purpose + preferences)
  const [fullRoomReferenceImages, setFullRoomReferenceImages] = useState<string[]>([])
  const [fullRoomText, setFullRoomText] = useState('')
  
  // State for component-based configuration
  const [arrangementConfig, setArrangementConfig] = useState({
    existingComponentsNote: '',
    removedComponentsNote: '' as string | undefined,
    newComponentsNote: '',
    arrangementPreferencesText: '',
  })

  // Component-based: AI-detected components and user choices (Keep/Remove, Add new?)
  const [detectedComponents, setDetectedComponents] = useState<DetectedComponent[]>([])
  const [componentDecisions, setComponentDecisions] = useState<Record<string, 'keep' | 'remove'>>({})
  const [addNewComponents, setAddNewComponents] = useState<boolean | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisFullReport, setAnalysisFullReport] = useState<string | null>(null)
  
  // State for Vastu preference
  const [vastuEnabled, setVastuEnabled] = useState(false)

  // Standalone Vastu-based configuration preferences (when configType === 'vastu')
  const [vastuPreferences, setVastuPreferences] = useState<VastuPreferences>({
    structuralChanges: null,
    rearrangeFurniture: null,
    newComponents: null,
    strictness: null as VastuStrictness,
    roomType: null as VastuRoomType,
    northDirectionText: '',
  })

  // State for component reference images (chairs, tables, etc.) – used when "Add new components" = Yes
  const [componentReferenceImages, setComponentReferenceImages] = useState<string[]>([])
  const [componentReferenceLabels, setComponentReferenceLabels] = useState<string[]>([])
  
  // State for generated result
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  // Original image from API (no watermark) – used when user clicks "Remove watermark"
  const [generatedImageOriginal, setGeneratedImageOriginal] = useState<string | null>(null)
  // Whether the displayed image currently has the watermark (so we can toggle Remove / Add watermark)
  const [showWatermark, setShowWatermark] = useState(true)
  // For before/after comparison: layout reference (first time) or image before customization (each customization loop)
  const [comparisonBeforeImageUrl, setComparisonBeforeImageUrl] = useState<string | null>(null)
  // History of generated images for undo (last configuration/customization)
  const [generatedImageHistory, setGeneratedImageHistory] = useState<string[]>([])
  // Generation history: last N generated results (newest first), for browsing and reloading
  const [generationHistory, setGenerationHistory] = useState<string[]>([])
  const MAX_GENERATION_HISTORY = 20
  // State for user favourites (saved generated images)
  const [favoriteImages, setFavoriteImages] = useState<string[]>([])
  
  // State for loading and errors
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  // Image type validation: internal vs external (warn when user uploads wrong type)
  const [imageTypeValidation, setImageTypeValidation] = useState<{ valid: boolean; message: string } | null>(null)
  const [isValidatingImageType, setIsValidatingImageType] = useState(false)

  // Post-generation visual customization (Customize mode)
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [isEditingStylePalette, setIsEditingStylePalette] = useState(false)
  const [selectedElementType, setSelectedElementType] = useState<CustomElementType | null>(null)
  const [customClickPosition, setCustomClickPosition] = useState<{ x: number; y: number } | null>(null)
  const [customStyles, setCustomStyles] = useState<Record<CustomElementType, string | null>>({
    wall: null,
    floor: null,
    ceiling: null,
    sofa: null,
    chair: null,
    desk: null,
    table: null,
    cabinet: null,
    door: null,
    window: null,
    'glass-partition': null,
    decor: null,
  })
  const [customHistory, setCustomHistory] = useState<Record<CustomElementType, string | null>[]>([])
  // Product variations from Supabase (by component type). null = not loaded, [] = loaded empty, array = use these options
  const [productVariations, setProductVariations] = useState<Partial<Record<CustomElementType, { id: string; label: string; description: string; color?: string; material?: string; texture?: string; finish?: string }[]>>>({})
  const [loadingVariations, setLoadingVariations] = useState(false)

  // External customization (when configType === 'external'): categories and presets
  const [externalCustomization, setExternalCustomization] = useState<ExternalCustomizationState>(
    getInitialExternalCustomization
  )
  const [selectedExternalCategory, setSelectedExternalCategory] = useState<ExternalCategory | null>(null)
  const [externalCustomHistory, setExternalCustomHistory] = useState<ExternalCustomizationState[]>([])
  // External: product_variations from Supabase by category (facade, window, door, etc.)
  const [externalProductVariations, setExternalProductVariations] = useState<Partial<Record<ExternalCategory, { id: string; label: string; description: string }[]>>>({})
  const [loadingExternalVariations, setLoadingExternalVariations] = useState(false)

  /** Wizard: current step (1 = type, 2 = upload, 3 = layout reference, 4 = configure & generate) */
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1)
  /** Index of the uploaded image chosen as layout reference (locks structure/camera). Null until user selects in step 3. */
  const [layoutReferenceImageIndex, setLayoutReferenceImageIndex] = useState<number | null>(null)

  /**
   * Handle configuration type change (Step 1)
   */
  const handleConfigTypeChange = (type: ConfigType) => {
    setConfigType(type)
    setImages([])
    setProductVariations({})
    setExternalProductVariations({})
    setGeneratedImage(null)
    setGeneratedImageOriginal(null)
    setShowWatermark(true)
    setComparisonBeforeImageUrl(null)
    setGeneratedImageHistory([])
     setFavoriteImages([])
    setDetectedComponents([])
    setComponentDecisions({})
    setAddNewComponents(null)
    setAnalysisFullReport(null)
    setVastuEnabled(type === 'vastu')
    if (type !== 'vastu') {
      setVastuPreferences({
        structuralChanges: null,
        rearrangeFurniture: null,
        newComponents: null,
        strictness: null,
        roomType: null,
        northDirectionText: '',
      })
    }
    setError(null)
    setWarning(null)
    setImageTypeValidation(null)
    setIsCustomizing(false)
    setSelectedElementType(null)
    setCustomClickPosition(null)
    setCustomStyles({
      wall: null,
      floor: null,
      ceiling: null,
      sofa: null,
      chair: null,
      desk: null,
      table: null,
      cabinet: null,
      door: null,
      window: null,
      'glass-partition': null,
      decor: null,
    })
    setCustomHistory([])
    setSelectedStyle(null)
    setSelectedColorPalette(null)
    setExternalCustomization(getInitialExternalCustomization())
    setSelectedExternalCategory(null)
    setExternalCustomHistory([])
    setWizardStep(1)
    setLayoutReferenceImageIndex(null)
  }

  /**
   * Restart the entire flow and clear all user inputs/state
   */
  const handleRestart = () => {
    setWizardStep(1)
    setLayoutReferenceImageIndex(null)
    setConfigType(null)
    setImages([])
    setConfigMode('purpose')
    setFullRoomReferenceImages([])
    setFullRoomText('')
    setArrangementConfig({
      existingComponentsNote: '',
      removedComponentsNote: undefined,
      newComponentsNote: '',
      arrangementPreferencesText: '',
    })
    setDetectedComponents([])
    setComponentDecisions({})
    setAddNewComponents(null)
    setIsAnalyzing(false)
    setAnalysisFullReport(null)
    setVastuEnabled(false)
    setVastuPreferences({
      structuralChanges: null,
      rearrangeFurniture: null,
      newComponents: null,
      strictness: null,
      roomType: null,
      northDirectionText: '',
    })
    setComponentReferenceImages([])
    setComponentReferenceLabels([])
    setGeneratedImage(null)
    setGeneratedImageOriginal(null)
    setShowWatermark(true)
    setComparisonBeforeImageUrl(null)
    setGeneratedImageHistory([])
    setFavoriteImages([])
    setIsGenerating(false)
    setError(null)
    setWarning(null)
    setImageTypeValidation(null)
    setIsCustomizing(false)
    setSelectedElementType(null)
    setCustomClickPosition(null)
    setCustomStyles({
      wall: null,
      floor: null,
      ceiling: null,
      sofa: null,
      chair: null,
      desk: null,
      table: null,
      cabinet: null,
      door: null,
      window: null,
      'glass-partition': null,
      decor: null,
    })
    setCustomHistory([])
    setSelectedStyle(null)
    setSelectedColorPalette(null)
    setExternalCustomization(getInitialExternalCustomization())
    setSelectedExternalCategory(null)
    setExternalCustomHistory([])
  }

  /**
   * Handle image upload - updates the images state
   */
  const handleImagesChange = (newImages: string[]) => {
    setImages(newImages)
    setImageTypeValidation(null)
    setLayoutReferenceImageIndex(null)
    if (newImages.length !== images.length) {
      setGeneratedImage(null)
      setGeneratedImageOriginal(null)
      setShowWatermark(true)
      setComparisonBeforeImageUrl(null)
       setFavoriteImages([])
      setIsCustomizing(false)
      setSelectedElementType(null)
      setCustomClickPosition(null)
      setCustomStyles({
        wall: null,
        floor: null,
        ceiling: null,
        sofa: null,
        chair: null,
        desk: null,
        table: null,
        cabinet: null,
        door: null,
        window: null,
        'glass-partition': null,
        decor: null,
      })
      setCustomHistory([])
    }
    if (configMode === 'arrangement') {
      setDetectedComponents([])
      setComponentDecisions({})
      setAddNewComponents(null)
      setAnalysisFullReport(null)
    }
  }

  /**
   * Handle configuration mode change
   */
  const handleConfigModeChange = (mode: 'purpose' | 'arrangement') => {
    setConfigMode(mode)
    setGeneratedImage(null)
    setGeneratedImageOriginal(null)
    setShowWatermark(true)
    setComparisonBeforeImageUrl(null)
    setFavoriteImages([])
    if (mode !== 'arrangement') {
      setAddNewComponents(null)
    }
    setIsCustomizing(false)
    setSelectedElementType(null)
    setCustomHistory([])
  }

  // Min images: internal 4+, external 3+
  const minImages = configType === 'external' ? 3 : 4
  const maxImages = 6

  /** Can proceed from Upload step only when: enough images + AI analysis says correct type (interior for internal, building for external). No proceeding otherwise. */
  const hasEnoughImagesForStep = configType != null && images.length >= minImages
  const imageTypeOkForStep =
    configType === 'vastu' ||
    imageTypeValidation === null ||
    imageTypeValidation.valid === true
  const canProceedFromUpload =
    hasEnoughImagesForStep &&
    !isValidatingImageType &&
    (configType === 'vastu' || imageTypeValidation?.valid === true)

  // Component-based: run AI analysis when arrangement is selected and we have enough images
  useEffect(() => {
    if (configType == null || configMode !== 'arrangement') return
    if (images.length < minImages) {
      setDetectedComponents([])
      setComponentDecisions({})
      setAnalysisFullReport(null)
      setIsAnalyzing(false)
      return
    }

    let cancelled = false
    setIsAnalyzing(true)
    setDetectedComponents([])
    setComponentDecisions({})
    setAddNewComponents(null)

    const internalFallback: DetectedComponent[] = [
      { id: 'sofa', label: 'Sofa' },
      { id: 'meeting-table', label: 'Meeting table' },
      { id: 'tv-unit', label: 'TV unit' },
      { id: 'chairs', label: 'Chairs' },
      { id: 'storage-cabinet', label: 'Storage cabinet' },
    ]
    const externalFallback: DetectedComponent[] = [
      { id: 'facade', label: 'Facade' },
      { id: 'main-gate', label: 'Main gate' },
      { id: 'compound-wall', label: 'Compound wall' },
      { id: 'balconies', label: 'Balconies' },
      { id: 'parking-area', label: 'Parking area' },
    ]
    const fallbackComponents = configType === 'external' ? externalFallback : internalFallback
    const apiUrl = configType === 'external' ? '/api/analyze-external' : '/api/analyze-room'

    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images }),
    })
      .then((res) => parseJsonOrText<{ components?: unknown[]; fullReport?: string }>(res))
      .then((data) => {
        if (cancelled) return
        const comps = (data.components?.length ? data.components : fallbackComponents) as DetectedComponent[]
        setDetectedComponents(comps)
        const decisions: Record<string, 'keep' | 'remove'> = {}
        comps.forEach((c) => { decisions[c.id] = 'keep' })
        setComponentDecisions(decisions)
        if (data.fullReport != null) setAnalysisFullReport(data.fullReport)
      })
      .catch(() => {
        if (!cancelled) {
          setDetectedComponents(fallbackComponents)
          const decisions: Record<string, 'keep' | 'remove'> = {}
          fallbackComponents.forEach((c) => { decisions[c.id] = 'keep' })
          setComponentDecisions(decisions)
        }
      })
      .finally(() => {
        if (!cancelled) setIsAnalyzing(false)
      })

    return () => { cancelled = true }
  }, [configType, configMode, images, minImages])

  // AI analyzes uploaded images: internal config = interior room images only; external config = building exterior only. No proceeding to next step unless AI confirms correct type.
  useEffect(() => {
    if (configType !== 'internal' && configType !== 'external') {
      setImageTypeValidation(null)
      return
    }
    if (images.length < 1) {
      setImageTypeValidation(null)
      return
    }

    let cancelled = false
    setIsValidatingImageType(true)
    setImageTypeValidation(null)

    const timer = setTimeout(() => {
      // Sample first and last image so we catch wrong type even if user adds bad images at the end (keep payload small)
      const imagesToValidate =
        images.length <= 2
          ? images.slice(0, 2)
          : [images[0], images[images.length - 1]]
      fetch('/api/validate-image-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: imagesToValidate,
          expectedType: configType,
        }),
      })
        .then(async (res) => {
          const text = await res.text()
          let data: { valid?: boolean; message?: string } = {}
          try {
            data = JSON.parse(text)
          } catch {
            if (!res.ok) return { valid: false, message: text || 'Validation failed.' }
          }
          return {
            valid: res.ok && data.valid === true,
            message: data?.message || (res.ok ? 'Images match.' : 'Image type does not match configuration.'),
          }
        })
        .then((data) => {
          if (cancelled) return
          setImageTypeValidation({ valid: data.valid === true, message: data.message || '' })
        })
        .catch(() => {
          if (!cancelled) setImageTypeValidation({ valid: true, message: 'Images accepted.' })
        })
        .finally(() => {
          if (!cancelled) setIsValidatingImageType(false)
        })
    }, 600)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [configType, images])

  // Internal: fetch room_variations from Supabase when user selects a component type in Customize
  useEffect(() => {
    if (configType !== 'internal' || !selectedElementType || productVariations[selectedElementType] !== undefined) return
    setLoadingVariations(true)
    fetch(`/api/product-variations?component=${encodeURIComponent(selectedElementType)}&context=internal`)
      .then(async (res) => {
        const text = await res.text()
        if (!res.ok) return []
        try {
          return JSON.parse(text) as { id: string; label: string; description: string; color?: string; material?: string; texture?: string; finish?: string }[]
        } catch {
          return []
        }
      })
      .then((data) => {
        setProductVariations((prev) => ({ ...prev, [selectedElementType]: Array.isArray(data) ? data : [] }))
      })
      .catch(() => {
        setProductVariations((prev) => ({ ...prev, [selectedElementType]: [] }))
      })
      .finally(() => setLoadingVariations(false))
  }, [configType, selectedElementType])

  // External: fetch product_variations from Supabase when user selects a category in Customize
  useEffect(() => {
    if (configType !== 'external' || !selectedExternalCategory || externalProductVariations[selectedExternalCategory] !== undefined) return
    const component = EXTERNAL_CATEGORY_TO_COMPONENT[selectedExternalCategory]
    setLoadingExternalVariations(true)
    fetch(`/api/product-variations?component=${encodeURIComponent(component)}&context=external`)
      .then(async (res) => {
        const text = await res.text()
        if (!res.ok) return []
        try {
          return JSON.parse(text) as { id: string; label: string; description: string }[]
        } catch {
          return []
        }
      })
      .then((data) => {
        setExternalProductVariations((prev) => ({ ...prev, [selectedExternalCategory]: Array.isArray(data) ? data : [] }))
      })
      .catch(() => {
        setExternalProductVariations((prev) => ({ ...prev, [selectedExternalCategory]: [] }))
      })
      .finally(() => setLoadingExternalVariations(false))
  }, [configType, selectedExternalCategory])

  // Sync Keep/Remove choices into arrangementConfig for the prompt
  useEffect(() => {
    if (configMode !== 'arrangement' || detectedComponents.length === 0) return

    const kept = detectedComponents.filter((c) => componentDecisions[c.id] !== 'remove')
    const removed = detectedComponents.filter((c) => componentDecisions[c.id] === 'remove')

    const existingNote = kept.length > 0
      ? kept.map((c) => `- ${c.label}`).join('\n') + '\n- Open floor area'
      : '- Open floor area'
    const removedNote = removed.length > 0 ? removed.map((c) => c.label).join(', ') : ''

    setArrangementConfig((prev) => {
      if (prev.existingComponentsNote === existingNote && prev.removedComponentsNote === removedNote) return prev
      return { ...prev, existingComponentsNote: existingNote, removedComponentsNote: removedNote || undefined }
    })
  }, [configMode, detectedComponents, componentDecisions])

  const handleComponentDecisionChange = useCallback((id: string, decision: 'keep' | 'remove') => {
    setComponentDecisions((prev) => ({ ...prev, [id]: decision }))
    setGeneratedImage(null)
    setComparisonBeforeImageUrl(null)
  }, [])

  // When user chooses not to add new components, set newComponentsNote so prompt is clear
  useEffect(() => {
    if (configMode !== 'arrangement') return
    if (addNewComponents === false) {
      setArrangementConfig((prev) => ({
        ...prev,
        newComponentsNote: 'None - only rearrange kept components and exclude removed ones. Do not add new furniture.',
      }))
    } else if (addNewComponents === true) {
      setArrangementConfig((prev) => ({ ...prev, newComponentsNote: '' }))
    }
  }, [configMode, addNewComponents])

  /**
   * Handle arrangement config changes
   */
  const handleArrangementChange = (field: string, value: any) => {
    setArrangementConfig(prev => ({
      ...prev,
      [field]: value,
    }))
    setGeneratedImage(null) // Clear result when config changes
    setGeneratedImageOriginal(null)
    setShowWatermark(true)
    setComparisonBeforeImageUrl(null)
    setFavoriteImages([])
  }

  /** Toggle favourite for the current image (heart on image). Add if not in list, remove if already favourited. */
  const toggleFavorite = (imageUrl: string | null) => {
    if (!imageUrl) return
    setFavoriteImages((prev) =>
      prev.includes(imageUrl) ? prev.filter((u) => u !== imageUrl) : [...prev, imageUrl]
    )
  }

  /**
   * Generate the room/external image using AI
   */
  const handleGenerate = async () => {
    // Vastu-based configuration uses a dedicated flow
    if (configType === 'vastu') {
      return handleGenerateVastu()
    }

    if (configType == null) {
      setError('Please select configuration type (Internal or External) first.')
      return
    }
    const required = configType === 'external' ? 3 : 4
    if (images.length < required) {
      setError(configType === 'internal'
        ? 'Please upload at least 4 images of the room.'
        : 'Please upload at least 3 external images (front, side/back, compound).')
      return
    }

    // Validate configuration based on mode (purpose: style is sufficient; ref images/text optional)
    if (configMode === 'purpose') {
      const hasRefImages = fullRoomReferenceImages.length > 0
      const hasText = fullRoomText.trim().length > 0
      const hasStyle = selectedStyle != null && selectedStyle.trim().length > 0
      if (!hasRefImages && !hasText && !hasStyle) {
        setError('Please select a design style, and optionally add a description or upload reference image(s).')
        return
      }
    }

    if (configMode === 'arrangement') {
      if (addNewComponents === null) {
        setError('Please choose whether you want to add new components (Yes or No).')
        return
      }
      if (addNewComponents === true) {
        if (componentReferenceImages.length === 0) {
          setError('You chose to add new components. Please upload at least 1 reference image for new components.')
          return
        }
        const hasAnyLabel = componentReferenceLabels.some(label => label && label.trim().length > 0)
        if (!hasAnyLabel) {
          setError('Please add a short description for at least one reference image (e.g., "desk", "chair", "storage unit").')
          return
        }
      }
    }

    setIsGenerating(true)
    setError(null)
    setWarning(null)

    try {
      // When applying customization, send current result so API preserves layout and only changes selected components
      const hasInternalCustomization = Object.values(customStyles).some((v) => v != null && v !== '')
      const hasExternalCustomization = configType === 'external' && EXTERNAL_CATEGORIES.some(
        (cat) => externalCustomization[cat] != null && externalCustomization[cat] !== ''
      )
      const hasCustomization = hasInternalCustomization || hasExternalCustomization
      // Style-only regeneration: user changed style/palette in Edit and clicked Regenerate — send current result so the new style is applied to this image (works for both Full Room and Arrangement modes)
      const hasStyleOrPalette = (selectedStyle != null && selectedStyle.trim() !== '') || (selectedColorPalette != null && selectedColorPalette.trim() !== '')
      const useCurrentResultForStyleRegenerate = hasStyleOrPalette && !!(generatedImageOriginal ?? generatedImage)
      // For comparison: show "before customization" vs "after customization"; set before to current result now
      if ((hasCustomization || useCurrentResultForStyleRegenerate) && generatedImage) {
        setComparisonBeforeImageUrl(generatedImage)
      }
      // Build human-readable labels for each selected customization style so the AI gets
      // real descriptions instead of opaque IDs like "decor_plants_green".
      const resolvedCustomizationLabels: Record<string, { label: string; description: string; isDecor: boolean }> = {}
      if (configType !== 'external') {
        Object.entries(customStyles).forEach(([elementType, optionId]) => {
          if (!optionId) return
          const elementKey = elementType as CustomElementType
          // Check Supabase variations first, then fall back to CUSTOMIZATION_LIBRARY
          const opts = productVariations[elementKey]?.length
            ? productVariations[elementKey]!
            : CUSTOMIZATION_LIBRARY[elementKey] ?? []
          const opt = opts.find((o) => o.id === optionId)
          if (opt) {
            resolvedCustomizationLabels[elementType] = {
              label: opt.label,
              description: opt.description,
              isDecor: elementType === 'decor',
            }
          }
        })
      }

      const payload = {
        configType: configType ?? 'internal',
        images,
        configMode,
        purposeInput: configMode === 'purpose' ? fullRoomText : undefined,
        fullRoomReferenceImages: configMode === 'purpose' ? fullRoomReferenceImages : undefined,
        fullRoomAdditionalText: undefined,
        arrangementConfig: configMode === 'arrangement' ? arrangementConfig : undefined,
        vastuEnabled: configType === 'external' ? false : vastuEnabled,
        componentReferenceImages: configMode === 'arrangement' ? componentReferenceImages : undefined,
        componentReferenceLabels: configMode === 'arrangement' ? componentReferenceLabels : undefined,
        customizationStyles: configType === 'external' ? undefined : customStyles,
        customizationLabels: configType === 'external' ? undefined : resolvedCustomizationLabels,
        externalCustomization: configType === 'external' ? externalCustomization : undefined,
        selectedStyle: selectedStyle ?? undefined,
        selectedColorPalette: selectedColorPalette ?? undefined,
        layoutImageIndex: layoutReferenceImageIndex ?? 0,
        // Send current result when applying component customizations OR when doing style/palette-only regeneration so the new style is applied to the current image
        ...((hasCustomization || useCurrentResultForStyleRegenerate) && (generatedImageOriginal ?? generatedImage)
          ? { currentResultImage: generatedImageOriginal ?? generatedImage }
          : {}),
      }

      // Call the API route
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const text = await response.text()
      let data: { error?: string; imageUrl?: string; warning?: string }
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error(response.ok ? 'Invalid response from server' : text || response.statusText || 'Failed to generate image')
      }
      if (!response.ok) {
        throw new Error(data?.error || text || 'Failed to generate image')
      }
      const imageUrl = data.imageUrl
      if (!imageUrl) throw new Error('No image URL in response')
      setWarning(data.warning ?? null)
      setGeneratedImageHistory((prev) => (generatedImage ? [...prev, generatedImage] : prev))
      setGeneratedImageOriginal(imageUrl)
      setShowWatermark(true)
      const watermarkedUrl = await applyWatermarkToImage(imageUrl)
      setGeneratedImage(watermarkedUrl)
      setGenerationHistory((prev) => [watermarkedUrl, ...prev.slice(0, MAX_GENERATION_HISTORY - 1)])
      // First generation (no customization): comparison left = layout reference
      if (!hasCustomization && images.length > 0) {
        const layoutIdx = layoutReferenceImageIndex ?? 0
        setComparisonBeforeImageUrl(images[layoutIdx])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  /**
   * Generate image for standalone Vastu-based configuration
   * Uses internal purpose-mode generation under the hood with a structured Vastu description.
   */
  const handleGenerateVastu = async (shuffleOverride?: boolean) => {
    if (images.length < 4) {
      setError('Please upload at least 4 images of the same room from different angles.')
      return
    }

    const { structuralChanges, rearrangeFurniture, newComponents, strictness, roomType, northDirectionText } = vastuPreferences
    if (
      structuralChanges === null ||
      rearrangeFurniture === null ||
      newComponents === null ||
      strictness == null ||
      roomType == null
    ) {
      setError('Please answer all Vastu questions before generating.')
      return
    }

    setIsGenerating(true)
    setError(null)
    setWarning(null)

    const structuralText = structuralChanges ? 'YES – visual suggestions for doors/partitions allowed.' : 'NO – do not modify walls, doors or fixed elements. Only visual hints allowed.'
    const rearrangeText = rearrangeFurniture ? 'YES – freely rearrange existing furniture as per Vastu.' : 'NO – keep existing furniture positions mostly stable; apply only light corrections.'
    const newComponentsExamples =
      roomType === 'pooja'
        ? 'storage in south/west, pooja unit/altar in north-east, lamps or diyas in appropriate zones, or light partitions for balance'
        : 'storage in south/west, mirrors in north/east, plants or light partitions for balance (do NOT add a pooja unit in this room type)'

    const newComponentsText = newComponents
      ? `YES – you MUST add only those new Vastu components that are clearly needed (for example ${newComponentsExamples}). Do NOT add random extra items.`
      : 'NO – ABSOLUTE RULE: do not introduce any new components at all (no new furniture, storage, pooja units, mirrors, partitions, decor, or other elements). Keep only the existing items from the room images.'

    const strictnessLabel =
      strictness === 'soft'
        ? 'Soft – prioritise practicality and aesthetics over strict rules.'
        : strictness === 'moderate'
        ? 'Moderate – correct major Vastu issues while staying realistic.'
        : 'Strict – follow Vastu rules aggressively, but still avoid impossible layouts.'

    const roomTypeLabelMap: Record<Exclude<VastuRoomType, null>, string> = {
      bedroom: 'Bedroom',
      living: 'Living room',
      workspace: 'Workspace',
      study: 'Study room',
      pooja: 'Pooja room',
    }

    const roomTypeLabelResolved = roomType ? roomTypeLabelMap[roomType as Exclude<VastuRoomType, null>] : 'Room'

    const roomUsageGuidance =
      roomType === 'bedroom'
        ? '- Function: This must clearly look and function as a BEDROOM (primary bed space). Include a main bed, appropriate side tables, and wardrobes/storage. Do NOT turn this into an office, reception, or workspace layout.'
        : roomType === 'living'
        ? '- Function: This must clearly look and function as a LIVING ROOM. Prioritise sofas/seating, coffee table, and informal gathering; avoid dominant office desks or workstation-style seating.'
        : roomType === 'workspace'
        ? '- Function: This must clearly look and function as a WORKSPACE. Prioritise work desks, ergonomic chairs, and storage for files; reception-style or casual lounge-only layouts are not acceptable as the main focus.'
        : roomType === 'study'
        ? '- Function: This must clearly look and function as a STUDY ROOM, not a corporate workspace or pooja room. Focus on 1–2 study desks, comfortable study chairs, bookshelves, and a calm reading corner. Avoid large reception counters, multiple visitor chairs, heavy office workstation layouts, or dedicated pooja units.'
        : roomType === 'pooja'
        ? '- Function: This must clearly look and function as a POOJA ROOM. Emphasise the pooja unit/altar, clean open floor near it, and minimal additional furniture. Avoid workspace or living-room style layouts.'
        : ''

    const vastuPurposeText = `
VASTU-BASED CONFIGURATION – STANDALONE MODULE

Room type: ${roomTypeLabelResolved}

User Vastu preferences:
- Structural changes: ${structuralText}
- Furniture rearrangement: ${rearrangeText}
- New components: ${newComponentsText}
- Strictness level: ${strictnessLabel}
${northDirectionText.trim() ? `- North direction (user description): ${northDirectionText.trim()}` : '- North direction: User did not specify clearly; use layout cues cautiously.'}

Functional use:
${roomUsageGuidance || '- Use the visual cues and user text to keep the functional use of the room consistent with the images.'}

Design intent:
- Perform a Vastu-oriented reconfiguration of the existing room based on the uploaded images.
- First understand the existing layout, furniture, open zones, heavy zones, entry, circulation, and approximate cardinal directions from the room images.
- Then apply Vastu corrections ONLY within the allowed boundaries above (structural changes, rearrangement, new components, strictness).

Important:
- Keep the same physical room as in the images (same walls, windows, doors, floor, ceiling, size). This is an image-to-image reconfiguration, not a new room.
- When structural changes are disallowed, treat walls/doors as fixed and use furniture placement, decor, lighting, and light partitions only.
- When new components are allowed (user answered YES), favour: storage in south/west, pooja in north-east, mirrors in north/east, and balanced partitions only where needed. Add ONLY these meaningful Vastu components – do not add random extra furniture.
- When new components are NOT allowed (user answered NO), ABSOLUTE RULE: do not add any new furniture, storage, pooja units, mirrors, partitions, decor, or other elements at all. Only rearrange or optimise the existing items according to Vastu.
- Keep the Brahmasthan (central zone of the room) as open and light as reasonably possible. Avoid placing heavy desks, storage, or dense chair clusters in the exact center; if the existing layout blocks the center, gently shift such items towards the south or west side while preserving usability.
- Always treat the provided North direction as the primary reference for directions. Do not assume a different North than what the user specified.
- Respect the chosen strictness so the final configuration is realistic and still usable for a real ${roomTypeLabelResolved.toLowerCase()}.`

    try {
      const hasCustomization = Object.values(customStyles).some((v) => v != null && v !== '')
      const payload = {
        configType: 'internal' as const,
        images,
        // Use purpose mode with a pre-built Vastu description
        configMode: 'purpose' as const,
        purposeInput: vastuPurposeText,
        fullRoomReferenceImages: [] as string[],
        fullRoomAdditionalText: undefined,
        arrangementConfig: undefined,
        vastuEnabled: true,
        shuffle: !!shuffleOverride,
        componentReferenceImages: undefined,
        componentReferenceLabels: undefined,
        customizationStyles: customStyles,
        selectedStyle: selectedStyle ?? undefined,
        selectedColorPalette: selectedColorPalette ?? undefined,
        layoutImageIndex: layoutReferenceImageIndex ?? 0,
        ...(hasCustomization && (generatedImageOriginal ?? generatedImage)
          ? { currentResultImage: generatedImageOriginal ?? generatedImage }
          : {}),
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const text = await response.text()
      let data: { error?: string; imageUrl?: string; warning?: string }
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error(response.ok ? 'Invalid response from server' : text || response.statusText || 'Failed to generate Vastu-based configuration')
      }
      if (!response.ok) {
        throw new Error(data?.error || text || 'Failed to generate Vastu-based configuration')
      }
      const imageUrl = data.imageUrl
      if (!imageUrl) throw new Error('No image URL in response')
      setWarning(data.warning ?? null)
      setGeneratedImageHistory((prev) => (generatedImage ? [...prev, generatedImage] : prev))
      setGeneratedImageOriginal(imageUrl)
      setShowWatermark(true)
      const watermarkedUrl = await applyWatermarkToImage(imageUrl)
      setGeneratedImage(watermarkedUrl)
      setGenerationHistory((prev) => [watermarkedUrl, ...prev.slice(0, MAX_GENERATION_HISTORY - 1)])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  // Check if generation button should be enabled (requires config type + enough images + mode requirements)
  const hasEnoughImages = configType != null && images.length >= (configType === 'external' ? 3 : 4)
  const imageTypeOk =
    configType === 'vastu' || imageTypeValidation === null || imageTypeValidation.valid
  const hasSelectedStyle = selectedStyle != null && selectedStyle.trim() !== ''
  // For purpose mode: style is required, reference images/text are optional (user can generate with just style)
  // For arrangement mode: style is required, plus component decisions and refs if adding new components
  const canGenerate =
    configType != null &&
    configType !== 'vastu' &&
    hasEnoughImages &&
    imageTypeOk &&
    layoutReferenceImageIndex != null &&
    hasSelectedStyle &&
    (configMode === 'purpose'
      ? true // Style is sufficient; reference images/text are optional
      : addNewComponents !== null &&
        (addNewComponents === false ||
          (componentReferenceImages.length > 0 &&
            componentReferenceLabels.some((l) => l && l.trim().length > 0))))

  return (
    <div className="page-shell">
      <div className="container">
        {/* Header */}
        <header className="app-header">
          <div className="app-title-group">
            <span className="app-badge">Prototype · Image to Image</span>
            <h1>AI Room Configuration Studio</h1>
            <p className="app-subtitle">
              Select Internal or External configuration, upload images, then let AI detect and reconfigure with full or component-based controls.
            </p>
          </div>

          <div className="status-pills">
            <span className="status-pill">
              Type:{' '}
              {configType == null
                ? '—'
                : configType === 'internal'
                ? '🏠 Internal'
                : configType === 'external'
                ? '🏡 External'
                : '🧭 Vastu-based'}
            </span>
            <span className="status-pill">
              Images: {images.length} / 6 (min {configType === 'external' ? 3 : 4})
            </span>
            {configType != null && configType !== 'vastu' && (
              <span className="status-pill">
                Mode: {configMode === 'purpose' ? (configType === 'external' ? 'Full external' : 'Full room') : 'Component-based'}
              </span>
            )}
            {(configType === 'internal' || configType === 'external') && (
              <span className="status-pill">
                Style: {selectedStyle ? selectedStyle.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '—'}
              </span>
            )}
            {layoutReferenceImageIndex != null && (
              <span className="status-pill status-pill-layout">
                🔒 Layout: Image {layoutReferenceImageIndex + 1}
              </span>
            )}
            {(configType === 'internal' || configType === 'external') && selectedColorPalette && (
              <span className="status-pill">
                Palette: {selectedColorPalette === 'surprise_me' ? 'Surprise Me' : selectedColorPalette.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            )}
            {configType === 'vastu' && (
              <span className="status-pill">
                Vastu module: On
              </span>
            )}
          </div>
        </header>

        {error && (
          <div className="error">
            {error}
          </div>
        )}
        {warning && (
          <div className="warning" style={{ marginTop: error ? '0.5rem' : 0, padding: '0.75rem 1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 8, color: '#1e40af', fontSize: '0.9rem' }}>
            {warning}
          </div>
        )}

        {/* Wizard step indicator */}
        <div className="wizard-steps">
          <div className={`wizard-step-dot ${wizardStep >= 1 ? 'active' : ''} ${wizardStep === 1 ? 'current' : ''}`}>
            <span className="wizard-step-num">1</span>
            <span className="wizard-step-name">Choose</span>
          </div>
          <div className={`wizard-step-line ${wizardStep >= 2 ? 'active' : ''}`} />
          <div className={`wizard-step-dot ${wizardStep >= 2 ? 'active' : ''} ${wizardStep === 2 ? 'current' : ''}`}>
            <span className="wizard-step-num">2</span>
            <span className="wizard-step-name">Upload</span>
          </div>
          <div className={`wizard-step-line ${wizardStep >= 3 ? 'active' : ''}`} />
          <div className={`wizard-step-dot ${wizardStep >= 3 ? 'active' : ''} ${wizardStep === 3 ? 'current' : ''}`}>
            <span className="wizard-step-num">3</span>
            <span className="wizard-step-name">Layout</span>
          </div>
          <div className={`wizard-step-line ${wizardStep >= 4 ? 'active' : ''}`} />
          <div className={`wizard-step-dot ${wizardStep >= 4 ? 'active' : ''} ${wizardStep === 4 ? 'current' : ''}`}>
            <span className="wizard-step-num">4</span>
            <span className="wizard-step-name">Configure</span>
          </div>
        </div>

        <div className="layout-grid">
          {/* Main workflow column */}
          <main>
            {/* ========== STEP 1 PAGE: Configuration Type ========== */}
            {wizardStep === 1 && (
              <div className="card wizard-page">
                <div className="step-label">🧭 STEP 1</div>
                <div className="step-title-row">
                  <h2>Configuration Type Selection</h2>
                </div>
                <p className="hint-text" style={{ marginBottom: '1rem' }}>
                  Choose what you want to configure. This helps the system know what kind of images to expect and apply the correct detection logic.
                </p>
                <div className="config-type-buttons">
                  <button
                    type="button"
                    className={`config-type-btn ${configType === 'internal' ? 'selected' : ''}`}
                    onClick={() => handleConfigTypeChange('internal')}
                  >
                    <span className="config-type-icon">🏠</span>
                    <span><strong>Internal Configuration</strong><br /><small>Room interiors, furniture, layout</small></span>
                  </button>
                  <button
                    type="button"
                    className={`config-type-btn ${configType === 'external' ? 'selected' : ''}`}
                    onClick={() => handleConfigTypeChange('external')}
                  >
                    <span className="config-type-icon">🏡</span>
                    <span><strong>External Configuration</strong><br /><small>Facade, gate, compound, parking</small></span>
                  </button>
                </div>
                <div className="wizard-nav">
                  <button
                    type="button"
                    className="button"
                    disabled={configType == null}
                    onClick={() => setWizardStep(2)}
                  >
                    Next: Upload images →
                  </button>
                </div>
              </div>
            )}

            {/* ========== STEP 2 PAGE: Upload & Validate ========== */}
            {wizardStep === 2 && configType != null && (
              <>
            <div className="card wizard-page">
              <div className="step-label">
                {configType === 'internal'
                  ? '🏠 STEP 2A'
                  : configType === 'external'
                  ? '🏡 STEP 2B'
                  : '🧭 STEP 2C'}
              </div>
              <div className="step-title-row">
                <h2>
                  {configType === 'internal'
                    ? 'Upload Internal Room Images'
                    : configType === 'external'
                    ? 'Upload External House Images'
                    : 'Upload Room Images for Vastu Analysis'}
                </h2>
                <span className="step-number">
                  {isValidatingImageType
                    ? 'Checking…'
                    : (configType === 'internal' || configType === 'external') && imageTypeValidation && !imageTypeValidation.valid
                    ? 'Upload required images'
                    : canProceedFromUpload
                    ? 'Ready'
                    : (configType === 'internal' || configType === 'external') && images.length >= minImages && imageTypeValidation == null
                    ? 'Checking…'
                    : images.length >= minImages
                    ? 'Ready'
                    : `${minImages}+ required`}
                </span>
              </div>
              <ImageUpload 
                images={images} 
                onImagesChange={handleImagesChange}
                minImages={minImages}
                maxImages={maxImages}
                hintText={
                  configType === 'internal'
                    ? 'Upload 4–6 clear photos of the same room from different angles (front, back, left, right, diagonals). Avoid blurry or very dark images.'
                    : configType === 'external'
                    ? 'Upload 3–6 images: front elevation, side/back views, and compound or open area. Clear daylight photos work best.'
                    : 'Upload 4–6 clear photos of the same room from different angles. These images represent the existing room structure for Vastu analysis.'
                }
              />
              {(configType === 'internal' || configType === 'external') && images.length >= 1 && (
                <>
                  {isValidatingImageType && (
                    <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#64748b' }}>
                      Checking image type…
                    </p>
                  )}
                  {!isValidatingImageType && imageTypeValidation && !imageTypeValidation.valid && (
                    <div
                      role="alert"
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.75rem 1rem',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        color: '#b91c1c',
                        fontSize: '0.9rem',
                      }}
                    >
                      <strong>⚠️ Oops! Something&apos;s not right with the images.</strong>
                      <span style={{ display: 'block', marginTop: '0.35rem' }}>
                        Please upload the required images to move to the next step.
                      </span>
                      <span style={{ display: 'block', marginTop: '0.5rem', fontWeight: 600 }}>
                        You cannot proceed until valid images are uploaded.
                      </span>
                    </div>
                  )}
                </>
              )}
              <div className="wizard-nav">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setWizardStep(1)}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  className="button"
                  disabled={!canProceedFromUpload}
                  onClick={() => setWizardStep(3)}
                >
                  Next: Select layout reference →
                </button>
              </div>
            </div>
              </>
            )}

            {/* ========== STEP 3 PAGE: Select layout reference ========== */}
            {wizardStep === 3 && configType != null && images.length >= minImages && (
              <div className="card wizard-page">
                <div className="step-label">
                  {configType === 'internal' ? '🏠' : configType === 'external' ? '🏡' : '🧭'} STEP 3
                </div>
                <div className="step-title-row">
                  <h2>Select layout reference</h2>
                </div>
                <p className="hint-text" style={{ marginBottom: '1rem' }}>
                  Choose <strong>one image</strong> that will define the structure and camera angle for all generations. Layout, wall positions, and proportions will stay fixed from this image; only styles, colors, materials, and components will change based on your choices.
                </p>
                <div className="layout-reference-grid">
                  {images.map((src, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`layout-reference-card ${layoutReferenceImageIndex === index ? 'selected' : ''}`}
                      onClick={() => setLayoutReferenceImageIndex(index)}
                    >
                      <img src={src} alt={`Image ${index + 1}`} />
                      {layoutReferenceImageIndex === index && (
                        <span className="layout-reference-badge">Layout reference</span>
                      )}
                      <span className="layout-reference-num">Image {index + 1}</span>
                    </button>
                  ))}
                </div>
                <div className="wizard-nav">
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setWizardStep(2)}
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    className="button"
                    disabled={layoutReferenceImageIndex === null}
                    onClick={() => setWizardStep(4)}
                  >
                    Next: Configure & generate →
                  </button>
                </div>
              </div>
            )}

            {/* ========== STEP 4 PAGE: Configure, Generate, Result ========== */}
            {wizardStep === 4 && configType != null && (
              <>
            <div className="wizard-nav wizard-nav-top">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setWizardStep(3)}
              >
                ← Back to layout reference
              </button>
            </div>
            {/* Layout locked indicator */}
            {layoutReferenceImageIndex != null && images[layoutReferenceImageIndex] && (
              <div className="card layout-locked-card">
                <div className="layout-locked-header">
                  <span className="layout-locked-icon" aria-hidden>🔒</span>
                  <div>
                    <h3 className="layout-locked-title">Layout locked</h3>
                    <p className="layout-locked-desc">
                      All generations use the same layout reference (Image {layoutReferenceImageIndex + 1}). Structure, camera angle, and proportions stay fixed. Only styles, colors, and components change. To use a different angle, click &quot;Back to layout reference&quot; above.
                    </p>
                  </div>
                </div>
                <div className="layout-locked-preview">
                  <img src={images[layoutReferenceImageIndex]} alt="Layout reference" />
                </div>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setWizardStep(3)}
                >
                  Change layout reference
                </button>
              </div>
            )}
            {/* Step 4: Configuration Mode or Vastu questionnaire */}
            {configType === 'vastu' ? (
              <div className="card">
                <div className="step-label">🧭 STEP 3C</div>
                <div className="step-title-row">
                  <h2>Answer Vastu Questions</h2>
                </div>
                <VastuQuestionnaire
                  preferences={vastuPreferences}
                  onChange={setVastuPreferences}
                />
              </div>
            ) : (
              <>
                {/* Step 3A/3B: Configuration Mode Selection */}
                <div id="step-configuration" className="card">
                  <div className="step-label">{configType === 'internal' ? '🏠 STEP 3A' : '🏡 STEP 3B'}</div>
                  <div className="step-title-row">
                    <h2>Choose Configuration Style</h2>
                  </div>
                  <ConfigurationSelector
                    variant={configType}
                    configMode={configMode}
                    onConfigModeChange={handleConfigModeChange}
                    arrangementConfig={arrangementConfig}
                    onArrangementChange={handleArrangementChange}
                    detectedComponents={detectedComponents}
                    componentDecisions={componentDecisions}
                    onComponentDecisionChange={handleComponentDecisionChange}
                    addNewComponents={addNewComponents}
                    onAddNewComponentsChange={(value) => {
                      setAddNewComponents(value)
                      setGeneratedImage(null)
                      setGeneratedImageOriginal(null)
                      setShowWatermark(true)
                      setComparisonBeforeImageUrl(null)
                    }}
                    isAnalyzing={isAnalyzing}
                    analysisFullReport={analysisFullReport}
                  />
                </div>

                {/* Step 3B/3C: Style Selection - appears right after config mode selection */}
                {(configMode === 'purpose' || configMode === 'arrangement') && (
                  <StyleSelector
                    selectedStyle={selectedStyle}
                    onSelect={setSelectedStyle}
                    variant={configType === 'external' ? 'external' : 'internal'}
                    stepLabel={configType === 'internal' ? '🏠 STEP 3B' : '🏡 STEP 3C'}
                  />
                )}

                {/* Color palette (optional) - after style selection */}
                {(configMode === 'purpose' || configMode === 'arrangement') && (
                  <ColorPaletteSelector
                    selectedPalette={selectedColorPalette}
                    onSelect={setSelectedColorPalette}
                    variant={configType === 'external' ? 'external' : 'internal'}
                    disabled={isGenerating}
                  />
                )}

                {/* Step 4: Reference Images (optional) - appears after style selection */}
                {configMode === 'arrangement' && (
                  <div className="card">
                    <div className="step-label">{configType === 'internal' ? '🏠 STEP 4A' : '🏡 STEP 4B'}</div>
                    <div className="step-title-row">
                      <h2>Reference Images for New Components</h2>
                    </div>
                    <p className="hint-text" style={{ marginBottom: '0.75rem' }}>
                      Upload reference images of desks, chairs, sofas, storage units, or decor you want to add.
                      For each image, add a short description (e.g. desk, chair, storage unit).
                    </p>
                    <ComponentReferenceUpload
                      referenceImages={componentReferenceImages}
                      referenceLabels={componentReferenceLabels}
                      onLabelsChange={setComponentReferenceLabels}
                      onChange={setComponentReferenceImages}
                      maxImages={6}
                    />
                  </div>
                )}

                {configMode === 'purpose' && (
                  <div className="card">
                    <div className="step-label">{configType === 'internal' ? '🏠 STEP 4A' : '🏡 STEP 4B'}</div>
                    <div className="step-title-row">
                      <h2>Reference Images & Preferences (Optional)</h2>
                    </div>
                    <p className="hint-text" style={{ marginBottom: '0.75rem' }}>
                      Optional: Upload reference images for additional style/layout guidance, or add a description below. Since you've already selected a style, you can skip this and generate directly, or add these for more customization.
                    </p>
                    <FullRoomReferenceUpload
                      referenceImages={fullRoomReferenceImages}
                      onChange={setFullRoomReferenceImages}
                      maxImages={4}
                    />
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                      <label htmlFor="full-room-text" className="label">
                        Add description or preferences (optional)
                      </label>
                      <textarea
                        id="full-room-text"
                        className="input"
                        style={{ minHeight: '80px', resize: 'vertical' }}
                        value={fullRoomText}
                        onChange={(e) => setFullRoomText(e.target.value)}
                        placeholder="e.g. Workspace for 15 members, warm lighting, plants near the window, desk by the wall..."
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Step 5: Generate */}
            <div className="card">
              <div className="step-label">
                {configType === 'internal'
                  ? '🏠 STEP 5A'
                  : configType === 'external'
                  ? '🏡 STEP 5B'
                  : '🧭 STEP 4C'}
              </div>
              <div className="step-title-row">
                <h2>
                  {configType === 'internal'
                    ? 'Generate AI Room'
                    : configType === 'external'
                    ? 'Generate AI External'
                    : 'Generate Vastu-Configured Room'}
                </h2>
              </div>
              <p className="hint-text">
                {configType === 'internal'
                  ? "The AI will keep your room's architecture and lighting, and only adjust furniture, layout, and styling based on your inputs."
                  : configType === 'external'
                  ? 'The AI will preserve the building structure and reconfigure external elements (facade, gate, compound, etc.) based on your inputs.'
                  : 'The AI will keep your room structure the same and apply Vastu-based rearrangement and corrections based on your answers.'}
              </p>
              <div className="button-group">
                <button
                  className="button"
                  onClick={configType === 'vastu' ? () => void handleGenerateVastu() : handleGenerate}
                  disabled={(configType === 'vastu' ? isGenerating || images.length < 4 || layoutReferenceImageIndex == null : !canGenerate || isGenerating)}
                >
                  {isGenerating ? (
                    <>
                      <span className="spinner" aria-hidden />
                      Generating...
                    </>
                  ) : configType === 'internal' ? (
                    'Generate Room Configuration'
                  ) : configType === 'external' ? (
                    'Generate External Configuration'
                  ) : (
                    'Generate Vastu-Based Configuration'
                  )}
                </button>
              </div>
            </div>

            {/* Loading state when generating: show image being customized (or layout reference on first run) + green bar */}
            {isGenerating && (
              <div className="card loading-card">
                {(generatedImage || images.length > 0) ? (
                  <div className="generating-fixed-layout">
                    <img
                      src={generatedImage ?? images[layoutReferenceImageIndex ?? 0]}
                      alt=""
                      aria-hidden
                    />
                    <div className="generating-bar-vertical-track" aria-hidden>
                      <div className="generating-bar-vertical" />
                    </div>
                  </div>
                ) : null}
                {!generatedImage && (
                  <div className="loading-card-message">
                    <span className="spinner" aria-hidden />
                    <p>{configType === 'internal' ? 'Generating your room configuration…' : 'Generating your external configuration…'}</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#64748b' }}>
                      This may take a moment.
                    </p>
                  </div>
                )}
                {generatedImage && (
                  <div className="loading-card-message" style={{ marginTop: '0.75rem' }}>
                    <span className="spinner" aria-hidden />
                    <p>Applying your customization…</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: '#64748b' }}>
                      Changes will appear in the result.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Result: only before/after comparison (output shown once) + action bar */}
            {generatedImage && !isGenerating && (
              <div className="card">
                <div
                  style={{
                    display: 'flex',
                    gap: '1.5rem',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: '1 1 0', minWidth: '260px' }}>
                    {/* Single output view: before vs after with draggable slider; heart on image to favourite */}
                    {(images.length > 0 || comparisonBeforeImageUrl) && (
                      <div className="before-after-section before-after-primary" style={{ position: 'relative' }}>
                        <h3 className="before-after-heading">Compare before & after</h3>
                        <p className="hint-text" style={{ marginBottom: '0.75rem' }}>
                          {comparisonBeforeImageUrl != null && images.length > 0 && comparisonBeforeImageUrl !== images[layoutReferenceImageIndex ?? 0]
                            ? 'Left: image before this customization. Right: result after customization. Drag the slider to compare.'
                            : 'Your generated result is on the right. Drag the slider to see the difference from your layout reference.'}
                        </p>
                        <BeforeAfterSlider
                          beforeImageUrl={comparisonBeforeImageUrl ?? (images.length > 0 ? images[layoutReferenceImageIndex ?? 0] : '')}
                          afterImageUrl={generatedImage}
                          beforeLabel={comparisonBeforeImageUrl != null && images.length > 0 && comparisonBeforeImageUrl !== images[layoutReferenceImageIndex ?? 0] ? 'Before (before customization)' : 'Before (layout reference)'}
                          afterLabel={comparisonBeforeImageUrl != null && images.length > 0 && comparisonBeforeImageUrl !== images[layoutReferenceImageIndex ?? 0] ? 'After (after customization)' : 'After (generated)'}
                        />
                        {generatedImage && (
                          <button
                            type="button"
                            onClick={() => toggleFavorite(generatedImage)}
                            aria-label={favoriteImages.includes(generatedImage) ? 'Remove from favourites' : 'Add to favourites'}
                            style={{
                              position: 'absolute',
                              top: '0.5rem',
                              right: '0.5rem',
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              border: 'none',
                              background: 'rgba(255,255,255,0.9)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.25rem',
                              color: favoriteImages.includes(generatedImage) ? '#e11d48' : '#94a3b8',
                              transition: 'color 0.2s, transform 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.08)'
                              if (!favoriteImages.includes(generatedImage)) e.currentTarget.style.color = '#e11d48'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)'
                              if (!favoriteImages.includes(generatedImage)) e.currentTarget.style.color = '#94a3b8'
                            }}
                          >
                            {favoriteImages.includes(generatedImage) ? '♥' : '♡'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Action bar: Download, Restart, Customize, Edit (favourite = heart on image) */}
                    <div className="result-actions">
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={async () => {
                          try {
                            await downloadImageWithLogo(
                              generatedImage,
                              `room-configuration-${Date.now()}.png`
                            )
                          } catch (e) {
                            console.error(e)
                            alert('Failed to download image.')
                          }
                        }}
                        disabled={isGenerating}
                      >
                        💾 Download image
                      </button>
                      {generatedImageOriginal != null && (
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={async () => {
                            if (showWatermark) {
                              setGeneratedImage(generatedImageOriginal)
                              setShowWatermark(false)
                            } else {
                              try {
                                const watermarkedUrl = await applyWatermarkToImage(generatedImageOriginal)
                                setGeneratedImage(watermarkedUrl)
                                setShowWatermark(true)
                              } catch (e) {
                                console.error(e)
                              }
                            }
                          }}
                          disabled={isGenerating}
                        >
                          {showWatermark ? 'Remove watermark' : 'Add watermark'}
                        </button>
                      )}
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={handleRestart}
                        disabled={isGenerating}
                      >
                        Restart configuration
                      </button>
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => {
                          if (!generatedImage) return
                          setIsCustomizing((v) => {
                            const next = !v
                            if (next) {
                              setCustomClickPosition(null)
                              // Internal: default to Wall so user can select multiple components (wall, floor, ceiling, etc.) then Apply once
                              if (configType === 'internal') setSelectedElementType('wall')
                              else setSelectedElementType(null)
                              if (configType === 'external') setSelectedExternalCategory('facade')
                            }
                            return next
                          })
                        }}
                        disabled={isGenerating}
                      >
                        {isCustomizing ? 'Close Customize' : 'Customize'}
                      </button>
                      {(configType === 'internal' || configType === 'external') && (
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => {
                            setIsEditingStylePalette((v) => !v)
                            if (!isEditingStylePalette) setIsCustomizing(false)
                          }}
                          disabled={isGenerating}
                        >
                          {isEditingStylePalette ? 'Close Edit' : '✏️ Edit style & palette'}
                        </button>
                      )}
                    </div>

                    {isEditingStylePalette && (configType === 'internal' || configType === 'external') && (
                      <div
                        style={{
                          marginTop: '1.25rem',
                          padding: '1rem',
                          borderRadius: '0.75rem',
                          border: '1px solid var(--color-border)',
                          background: 'var(--color-surface)',
                        }}
                      >
                        <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                          Edit style & color palette
                        </h3>
                        <p className="hint-text" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                          Change the style or color palette below, then click Regenerate to create a new image with the same layout.
                        </p>
                        <StyleSelector
                          selectedStyle={selectedStyle}
                          onSelect={setSelectedStyle}
                          variant={configType === 'external' ? 'external' : 'internal'}
                          stepLabel="Style"
                        />
                        <ColorPaletteSelector
                          selectedPalette={selectedColorPalette}
                          onSelect={setSelectedColorPalette}
                          variant={configType === 'external' ? 'external' : 'internal'}
                          disabled={isGenerating}
                        />
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                          <button
                            type="button"
                            className="button button-primary"
                            disabled={!canGenerate || isGenerating}
                            onClick={async () => {
                              await handleGenerate()
                              setIsEditingStylePalette(false)
                            }}
                          >
                            {isGenerating ? (
                              <>
                                <span className="spinner" aria-hidden />
                                Generating…
                              </>
                            ) : (
                              'Regenerate with new style'
                            )}
                          </button>
                          <button
                            type="button"
                            className="button button-secondary"
                            onClick={() => setIsEditingStylePalette(false)}
                            disabled={isGenerating}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {isCustomizing && (
                      <div
                        style={{
                          marginTop: '1.25rem',
                          padding: '1rem',
                          borderRadius: '0.75rem',
                          border: '1px solid #e2e8f0',
                          background: '#f9fafb',
                        }}
                      >
                        <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                          {configType === 'external' ? 'Customize exterior (no layout change)' : 'Customize visual style (no layout change)'}
                        </h3>
                        <p className="hint-text" style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                          {configType === 'external'
                            ? 'Choose a category below, then pick a material or style preset. Only colors, textures, and materials change – structure stays the same.'
                            : 'Click inside the image to choose the area you want to customize. Only colors, textures, and materials will change – layout, sizes, and positions stay exactly the same.'}
                        </p>

                        {configType === 'external' ? (
                          /* External: category tabs + presets */
                          <>
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '0.5rem',
                                marginBottom: '0.75rem',
                              }}
                            >
                              {EXTERNAL_CATEGORIES.map((cat) => (
                                <button
                                  key={cat}
                                  type="button"
                                  className="button button-secondary"
                                  style={{
                                    padding: '0.35rem 0.75rem',
                                    fontSize: '0.8rem',
                                    background: selectedExternalCategory === cat ? 'rgba(59, 130, 246, 0.12)' : undefined,
                                    borderColor: selectedExternalCategory === cat ? '#3b82f6' : undefined,
                                  }}
                                  onClick={() => setSelectedExternalCategory(cat)}
                                >
                                  {EXTERNAL_CATEGORY_LABELS[cat]}
                                </button>
                              ))}
                            </div>
                            {selectedExternalCategory && (
                              <>
                                <p style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                                  <strong>{EXTERNAL_CATEGORY_LABELS[selectedExternalCategory]} — from catalog</strong>
                                </p>
                                {loadingExternalVariations ? (
                                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.6rem' }}>Loading variations from catalog…</p>
                                ) : (
                                <div
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                    gap: '0.5rem',
                                    marginBottom: '0.6rem',
                                  }}
                                >
                                  {(externalProductVariations[selectedExternalCategory]?.length
                                    ? externalProductVariations[selectedExternalCategory]!
                                    : EXTERNAL_CUSTOMIZATION_PRESETS[selectedExternalCategory]
                                  ).map((opt) => (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      className="button button-secondary"
                                      style={{
                                        textAlign: 'left',
                                        padding: '0.5rem 0.6rem',
                                        fontSize: '0.8rem',
                                        background:
                                          externalCustomization[selectedExternalCategory] === opt.id
                                            ? 'rgba(16, 185, 129, 0.12)'
                                            : undefined,
                                        borderColor:
                                          externalCustomization[selectedExternalCategory] === opt.id ? '#10b981' : undefined,
                                      }}
                                      onClick={() => {
                                        setExternalCustomHistory((prev) => [...prev, { ...externalCustomization }])
                                        setExternalCustomization((prev) => ({
                                          ...prev,
                                          [selectedExternalCategory]: opt.id,
                                        }))
                                      }}
                                    >
                                      <div style={{ fontWeight: 600 }}>{opt.label}</div>
                                      {opt.description && (
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                                          {opt.description}
                                        </div>
                                      )}
                                    </button>
                                  ))}
                                </div>
                                )}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem' }}>
                                  <button
                                    type="button"
                                    className="button button-secondary"
                                    onClick={() => {
                                      setExternalCustomHistory((prev) => [...prev, { ...externalCustomization }])
                                      setExternalCustomization((prev) => ({
                                        ...prev,
                                        [selectedExternalCategory]: null,
                                      }))
                                    }}
                                  >
                                    Reset this category
                                  </button>
                                  <button
                                    type="button"
                                    className="button button-secondary"
                                    disabled={externalCustomHistory.length === 0 && generatedImageHistory.length === 0}
                                    onClick={() => {
                                      setExternalCustomHistory((prev) => {
                                        if (prev.length === 0) return prev
                                        const last = prev[prev.length - 1]
                                        setExternalCustomization(last)
                                        return prev.slice(0, prev.length - 1)
                                      })
                                      setGeneratedImageHistory((prev) => {
                                        if (prev.length === 0) return prev
                                        const lastImage = prev[prev.length - 1]
                                        setGeneratedImage(lastImage)
                                        return prev.slice(0, prev.length - 1)
                                      })
                                    }}
                                  >
                                    Undo last change
                                  </button>
                                </div>
                              </>
                            )}
                            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}>
                              <button
                                type="button"
                                className="button"
                                disabled={isGenerating}
                                onClick={() => void handleGenerate()}
                              >
                                Apply customization (regenerate)
                              </button>
                            </div>
                          </>
                        ) : (
                          /* Internal: component chips + material library (no image click required); single Apply all */
                          <>
                            <p style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                              Select component types below (wall, floor, ceiling, door, etc.), pick a style for each, then click <strong>Apply all customizations</strong> once to regenerate the room with all selections.
                            </p>
                            {/* Optional: click image to set focus point */}
                            <div style={{ marginBottom: '0.75rem' }}>
                              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.35rem' }}>Optional: click image to set focus area for generation</p>
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  const target = e.currentTarget.querySelector('img')
                                  if (!target) return
                                  const rect = target.getBoundingClientRect()
                                  const x = (e.clientX - rect.left) / rect.width
                                  const y = (e.clientY - rect.top) / rect.height
                                  setCustomClickPosition({ x: Math.min(Math.max(x, 0), 1), y: Math.min(Math.max(y, 0), 1) })
                                }}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click() }}
                                style={{ cursor: 'crosshair', display: 'inline-block', maxWidth: '240px', borderRadius: '8px', overflow: 'hidden', border: '2px solid var(--color-border)' }}
                              >
                                <img src={generatedImage} alt="Result – optional click to focus" style={{ display: 'block', width: '100%', height: 'auto', pointerEvents: 'none' }} />
                              </div>
                            </div>
                            {/* Component type chips – always visible */}
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '0.5rem',
                                marginBottom: '0.75rem',
                              }}
                            >
                              {(Object.keys(CUSTOMIZATION_LIBRARY) as CustomElementType[]).map((type) => (
                                <button
                                  key={type}
                                  type="button"
                                  className="button button-secondary"
                                  style={{
                                    padding: '0.3rem 0.7rem',
                                    fontSize: '0.8rem',
                                    background: selectedElementType === type ? 'rgba(59, 130, 246, 0.12)' : undefined,
                                    borderColor: selectedElementType === type ? '#3b82f6' : undefined,
                                  }}
                                  onClick={() => setSelectedElementType(type)}
                                >
                                  {type === 'glass-partition' ? 'Glass partition' : type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                              ))}
                            </div>
                            {selectedElementType && (
                              <>
                                <p style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                                  <strong>
                                    {selectedElementType === 'glass-partition' ? 'Glass partition' : selectedElementType.charAt(0).toUpperCase() + selectedElementType.slice(1)} – pick a style
                                  </strong>
                                </p>
                                {loadingVariations ? (
                                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.6rem' }}>Loading variations from catalog…</p>
                                ) : (
                                <div style={{ marginBottom: '0.6rem', overflowX: 'auto' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                                    <thead>
                                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                        <th style={{ padding: '0.5rem 0.6rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Color</th>
                                        <th style={{ padding: '0.5rem 0.6rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Style Name</th>
                                        <th style={{ padding: '0.5rem 0.6rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Material</th>
                                        <th style={{ padding: '0.5rem 0.6rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Texture</th>
                                        <th style={{ padding: '0.5rem 0.6rem', textAlign: 'center', fontWeight: 600, color: '#475569' }}></th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(productVariations[selectedElementType]?.length ? productVariations[selectedElementType]! : CUSTOMIZATION_LIBRARY[selectedElementType]).map((opt: { id: string; label: string; description: string; color?: string; material?: string; texture?: string; finish?: string }) => {
                                        const materialRaw = (opt.material ?? '').trim()
                                        const finish = (opt.finish ?? '').trim()
                                        const genericMaterial = ['fabric', 'paint'].includes(materialRaw.toLowerCase())
                                        const materialDisplay = genericMaterial
                                          ? (finish || '—')
                                          : [materialRaw, finish].filter(Boolean).join(', ') || '—'
                                        const texture = opt.texture ?? '—'
                                        const swatchHex = swatchHexFromOption(opt)
                                        const isSelected = customStyles[selectedElementType] === opt.id
                                        return (
                                          <tr
                                            key={opt.id}
                                            style={{
                                              borderBottom: '1px solid #f1f5f9',
                                              background: isSelected ? 'rgba(16, 185, 129, 0.06)' : undefined,
                                            }}
                                          >
                                            <td style={{ padding: '0.5rem 0.6rem', verticalAlign: 'middle' }}>
                                              <div style={{ width: 48, height: 48, borderRadius: '6px', background: swatchHex, border: '1px solid #e2e8f0' }} title={String(opt.label)} />
                                            </td>
                                            <td style={{ padding: '0.5rem 0.6rem', verticalAlign: 'middle' }}>
                                              <div style={{ fontWeight: 600 }}>{String(opt.label)}</div>
                                              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>{String(opt.description)}</div>
                                            </td>
                                            <td style={{ padding: '0.5rem 0.6rem', verticalAlign: 'middle', color: '#475569' }}>{materialDisplay}</td>
                                            <td style={{ padding: '0.5rem 0.6rem', verticalAlign: 'middle', color: '#475569' }}>{texture}</td>
                                            <td style={{ padding: '0.5rem 0.6rem', verticalAlign: 'middle', textAlign: 'center' }}>
                                              <button
                                                type="button"
                                                className="button button-secondary"
                                                style={{
                                                  padding: '0.35rem 0.6rem',
                                                  fontSize: '0.75rem',
                                                  background: isSelected ? '#10b981' : '#2563eb',
                                                  color: '#fff',
                                                  border: 'none',
                                                }}
                                                onClick={() => {
                                                  setCustomHistory((prev) => [...prev, { ...customStyles }])
                                                  setCustomStyles((prev) => ({ ...prev, [selectedElementType]: opt.id }))
                                                }}
                                              >
                                                Select
                                              </button>
                                            </td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                                )}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                                  <button
                                    type="button"
                                    className="button button-secondary"
                                    onClick={() => {
                                      if (!selectedElementType) return
                                      setCustomHistory((prev) => [...prev, { ...customStyles }])
                                      setCustomStyles((prev) => ({ ...prev, [selectedElementType]: null }))
                                    }}
                                  >
                                    Reset {selectedElementType}
                                  </button>
                                  <button
                                    type="button"
                                    className="button button-secondary"
                                    disabled={customHistory.length === 0 && generatedImageHistory.length === 0}
                                    onClick={() => {
                                      setCustomHistory((prev) => {
                                        if (prev.length === 0) return prev
                                        const last = prev[prev.length - 1]
                                        setCustomStyles(last)
                                        return prev.slice(0, prev.length - 1)
                                      })
                                      setGeneratedImageHistory((prev) => {
                                        if (prev.length === 0) return prev
                                        const lastImage = prev[prev.length - 1]
                                        setGeneratedImage(lastImage)
                                        return prev.slice(0, prev.length - 1)
                                      })
                                    }}
                                  >
                                    Undo last change
                                  </button>
                                </div>
                              </>
                            )}
                            {/* Your selections summary */}
                            {(Object.keys(customStyles) as CustomElementType[]).some((k) => customStyles[k] != null) && (
                              <div style={{ marginBottom: '0.75rem', padding: '0.6rem 0.75rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '0.85rem' }}>
                                <strong style={{ color: '#0f766e' }}>Your selections</strong>
                                <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.2rem', color: '#134e4a' }}>
                                  {(Object.keys(customStyles) as CustomElementType[]).map((type) => {
                                    const id = customStyles[type]
                                    if (id == null) return null
                                    const opts = productVariations[type]?.length ? productVariations[type]! : CUSTOMIZATION_LIBRARY[type]
                                    const label = opts?.find((o: { id: string }) => o.id === id)?.label ?? id
                                    const typeLabel = type === 'glass-partition' ? 'Glass partition' : type.charAt(0).toUpperCase() + type.slice(1)
                                    return (
                                      <li key={type}>
                                        {typeLabel}: {label}
                                      </li>
                                    )
                                  })}
                                </ul>
                              </div>
                            )}
                            {/* Single Apply all customizations button */}
                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                              <button
                                type="button"
                                className="button"
                                disabled={isGenerating}
                                style={{
                                  padding: '0.55rem 1.1rem',
                                  background: (Object.keys(customStyles) as CustomElementType[]).some((k) => customStyles[k] != null) ? '#0d9488' : '#94a3b8',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontWeight: 600,
                                  fontSize: '0.9rem',
                                }}
                                onClick={() => {
                                  if (configType === 'vastu') void handleGenerateVastu()
                                  else void handleGenerate()
                                }}
                              >
                                {isGenerating ? (
                                  <>
                                    <span className="spinner" aria-hidden style={{ marginRight: '0.35rem' }} />
                                    Applying…
                                  </>
                                ) : (
                                  'Apply all customizations'
                                )}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Vastu explanation column (for Vastu-based or Vastu-enabled internal configs) */}
                  {(configType === 'vastu' || (configType === 'internal' && vastuEnabled)) && (
                    <div
                      style={{
                        flex: '0 0 260px',
                        maxWidth: '320px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                      }}
                    >
                      <div className="step-title-row" style={{ marginBottom: '0.25rem' }}>
                        <h2 style={{ fontSize: '1rem' }}>Vastu principles applied</h2>
                      </div>
                      {/* Where Vastu rules are applied in the layout */}
                      <h3 style={{ fontSize: '0.9rem', marginTop: '0.4rem', marginBottom: '0.25rem' }}>
                        Where Vastu is applied in this layout
                      </h3>
                      <ul
                        style={{
                          fontSize: '0.85rem',
                          color: '#475569',
                          paddingLeft: '1.1rem',
                          margin: 0,
                          listStyleType: 'disc',
                        }}
                      >
                        <li>
                          <strong>Heavy vs light zones:</strong> Seating, storage, and other heavy items are biased towards the
                          south/west side of the room, while the north/east side is kept visually lighter and more open.
                        </li>
                        <li>
                          <strong>Center (Brahmasthan):</strong> The central area of the room is kept relatively free of very
                          heavy furniture so movement and energy flow are not blocked.
                        </li>
                        {vastuPreferences.newComponents && (
                          <li>
                            <strong>New Vastu components:</strong> Storage is favoured in south/west, any pooja zone is biased
                            towards the north-east corner, and mirrors/reflective elements are preferred on north/east walls.
                          </li>
                        )}
                        {vastuPreferences.rearrangeFurniture && (
                          <li>
                            <strong>Furniture rearrangement:</strong> Existing sofas, tables, and cabinets are repositioned so
                            they avoid blocking the entry path and windows, and align better with the north–south directions you
                            provided.
                          </li>
                        )}
                        {vastuPreferences.structuralChanges && (
                          <li>
                            <strong>Structural hints only:</strong> Where needed, the AI may suggest shifting or soft-partitioning
                            door/opening locations in the visual to improve entry flow, without treating these as construction
                            drawings.
                          </li>
                        )}
                      </ul>
                      <p className="hint-text" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                        Note: This panel explains how the Vastu rules influence the layout (heavy vs light zones, open center,
                        directional placement). The exact pixels of the generated image still depend on the image model.
                      </p>
                    </div>
                  )}

                  {generationHistory.length > 0 && (
                    <div
                      className="card"
                      style={{
                        flex: '0 0 240px',
                        maxWidth: '280px',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h2 style={{ fontSize: '1.05rem', margin: 0 }}>Generation history</h2>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#64748b',
                            background: '#f1f5f9',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '999px',
                          }}
                        >
                          {generationHistory.length} {generationHistory.length === 1 ? 'version' : 'versions'}
                        </span>
                      </div>
                      <p className="hint-text" style={{ marginBottom: '0.75rem', fontSize: '0.8rem', lineHeight: 1.35 }}>
                        First generated is V1. Click a version to load it; ♡ to mark as favourite.
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.6rem',
                          maxHeight: '340px',
                          overflowY: 'auto',
                          paddingRight: '2px',
                        }}
                      >
                        {[...generationHistory].reverse().map((url, index) => {
                          const versionNumber = index + 1
                          const isCurrent = generatedImage === url
                          const originalIndex = generationHistory.length - 1 - index
                          return (
                            <button
                              key={`history-${originalIndex}-${url.slice(0, 30)}`}
                              type="button"
                              onClick={() => setGeneratedImage(url)}
                              aria-pressed={isCurrent}
                              aria-label={`Version ${versionNumber}${isCurrent ? ' (current)' : ''}`}
                              style={{
                                position: 'relative',
                                border: isCurrent ? '2px solid #2563eb' : '1px solid #e2e8f0',
                                borderRadius: '8px',
                                padding: 0,
                                overflow: 'hidden',
                                background: isCurrent ? 'rgba(37, 99, 235, 0.08)' : '#fff',
                                cursor: 'pointer',
                                boxShadow: isCurrent ? '0 2px 8px rgba(37, 99, 235, 0.15)' : '0 1px 3px rgba(0,0,0,0.06)',
                                transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
                              }}
                              onMouseEnter={(e) => {
                                if (!isCurrent) {
                                  e.currentTarget.style.borderColor = '#94a3b8'
                                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)'
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isCurrent) {
                                  e.currentTarget.style.borderColor = '#e2e8f0'
                                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
                                }
                              }}
                            >
                              <div style={{ position: 'relative' }}>
                                <img
                                  src={url}
                                  alt={`Version ${versionNumber}`}
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    height: '96px',
                                    objectFit: 'cover',
                                  }}
                                />
                                <span
                                  style={{
                                    position: 'absolute',
                                    top: '6px',
                                    left: '6px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    color: '#fff',
                                    background: 'rgba(0,0,0,0.6)',
                                    padding: '0.15rem 0.4rem',
                                    borderRadius: '4px',
                                  }}
                                >
                                  v{versionNumber}
                                </span>
                                {isCurrent && (
                                  <span
                                    style={{
                                      position: 'absolute',
                                      bottom: '6px',
                                      right: '6px',
                                      fontSize: '0.65rem',
                                      fontWeight: 700,
                                      color: '#fff',
                                      background: '#2563eb',
                                      padding: '0.2rem 0.45rem',
                                      borderRadius: '4px',
                                    }}
                                  >
                                    Current
                                  </span>
                                )}
                                <button
                                  type="button"
                                  aria-label={favoriteImages.includes(url) ? 'Remove from favourites' : 'Add to favourites'}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleFavorite(url)
                                  }}
                                  style={{
                                    position: 'absolute',
                                    top: '6px',
                                    right: '6px',
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: 'rgba(255,255,255,0.95)',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.95rem',
                                    color: favoriteImages.includes(url) ? '#e11d48' : '#94a3b8',
                                  }}
                                >
                                  {favoriteImages.includes(url) ? '♥' : '♡'}
                                </button>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                      <button
                        type="button"
                        className="button button-secondary"
                        style={{ marginTop: '0.75rem', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                        onClick={() => setGenerationHistory([])}
                      >
                        Clear history
                      </button>
                    </div>
                  )}

                </div>
              </div>
            )}
            </>
            )}
          </main>

          {/* Side guidance panel */}
          <aside className="side-panel">
            <div className="card card-muted">
              <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>
                How to get the best results
              </h2>

              <div className="side-panel-section">
                <h3 style={{ fontSize: '0.95rem' }}>Upload tips</h3>
                <ul className="side-panel-list">
                  <li>
                    <span className="side-panel-dot" />
                    <span><strong>Internal:</strong> 4–6 photos of the same room from different angles.</span>
                  </li>
                  <li>
                    <span className="side-panel-dot" />
                    <span><strong>External:</strong> Front elevation, side/back views, compound or open area (min 3).</span>
                  </li>
                  <li>
                    <span className="side-panel-dot" />
                    <span>Keep the camera level; avoid blur or very dark lighting.</span>
                  </li>
                </ul>
              </div>

              <div className="side-panel-section">
                <h3 style={{ fontSize: '0.95rem' }}>Prompt hints</h3>
                <ul className="side-panel-list">
                  <li>
                    <span className="side-panel-dot" />
                    <span>Describe <strong>who</strong> will use the room and <strong>how</strong> (e.g. “play room for students with colorful and natural light effect”).</span>
                  </li>
                  <li>
                    <span className="side-panel-dot" />
                    <span>For component-based mode, be specific about desk counts, storage, and collaboration zones.</span>
                  </li>
                  <li>
                    <span className="side-panel-dot" />
                    <span>Describe your preferred layout and who will use the space for best results.</span>
                  </li>
                </ul>
              </div>

            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
