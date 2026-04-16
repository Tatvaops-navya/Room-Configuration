'use client'

import { useState, useEffect, useCallback, useRef, useMemo, type Dispatch, type SetStateAction } from 'react'
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
import OptionalReconfigureHints from './components/OptionalReconfigureHints'
import BeforeAfterSlider from './components/BeforeAfterSlider'
import ResultPreviewToolbar from './components/ResultPreviewToolbar'
import RoomImmersiveTourSection from './components/RoomImmersiveTourSection'
import EraseRegionSelector, { type EraseRegion } from './components/EraseRegionSelector'
import RegionEraseConfirmPanel from './components/RegionEraseConfirmPanel'
import RoomEditorWorkbench from './components/room-editor/RoomEditorWorkbench'
import SelectionModeToolbar from './components/room-editor/SelectionModeToolbar'
import CanvasInteraction from './components/room-editor/CanvasInteraction'
import PreviewPanel from './components/room-editor/PreviewPanel'
import SidePanel from './components/room-editor/SidePanel'
import HistoryManager from './lib/room-editor/HistoryManager'
import CustomizationStyleGrid, { type StyleGridOption } from './components/CustomizationStyleGrid'
import { useRoomEditorStore } from './lib/room-editor/roomEditorStore'
import {
  type ExternalCategory,
  type ExternalCustomizationState,
  EXTERNAL_CATEGORIES,
  EXTERNAL_CATEGORY_LABELS,
  EXTERNAL_CUSTOMIZATION_PRESETS,
} from './utils/externalCustomizationPresets'
import { downloadImageWithLogo, applyWatermarkToImage } from './utils/downloadWithLogo'
import { useCustomization, type CustomAction } from '@/app/hooks/useCustomization'
import { useWizardState } from '@/app/hooks/useWizardState'
import { postJsonWithRetry } from '@/app/hooks/useGeneration'
import { useRoomEditorImageSync } from '@/app/hooks/useRoomEditor'
import type { ConfigType } from '@/app/types/config'

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

export type { ConfigType } from '@/app/types/config'

type CustomElementType =
  | 'wall'
  | 'floor'
  | 'ceiling'
  | 'sofa'
  | 'chair'
  | 'desk'
  | 'table'
  | 'dining'
  | 'cabinet'
  | 'door'
  | 'window'
  | 'glass-partition'
  | 'decor'

const CUSTOM_ACTION_OPTIONS: { id: CustomAction; label: string }[] = [
  { id: 'edit', label: 'Edit' },
  { id: 'add', label: 'Add Object' },
  { id: 'replace', label: 'Replace' },
  { id: 'erase', label: 'Erase' },
]

function customActionDisplayLabel(action: CustomAction): string {
  if (action === 'edit') return 'Customize'
  return action.charAt(0).toUpperCase() + action.slice(1)
}

function stylePaletteKey(style: string | null, palette: string | null): string {
  return `${style ?? ''}::${palette ?? ''}`
}

/** Customize / Add / Replace / Erase — reused under layout preview (Step 4A) and under each generated result. */
function CustomizationModeActionButtons({
  selectedCustomAction,
  onSelect,
  variant,
  onGenerate360,
  generate360Disabled = false,
}: {
  selectedCustomAction: CustomAction
  onSelect: (action: CustomAction) => void
  variant: 'overlay' | 'bar'
  onGenerate360?: () => void
  generate360Disabled?: boolean
}) {
  const isOverlay = variant === 'overlay'
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: isOverlay ? 'nowrap' : 'wrap',
        gap: isOverlay ? '0.35rem' : '0.5rem',
        justifyContent: 'center',
        overflowX: isOverlay ? 'auto' : 'visible',
        maxWidth: '100%',
        scrollbarWidth: isOverlay ? 'thin' : undefined,
      }}
    >
      {CUSTOM_ACTION_OPTIONS.map((action) => (
        <button
          key={action.id}
          type="button"
          className="button button-secondary"
          style={{
            padding: isOverlay ? '0.28rem 0.72rem' : '0.4rem 1rem',
            fontSize: isOverlay ? '0.78rem' : '0.85rem',
            borderRadius: isOverlay ? '999px' : '8px',
            background:
              selectedCustomAction === action.id
                ? 'rgba(16, 185, 129, 0.24)'
                : isOverlay
                  ? 'rgba(255,255,255,0.92)'
                  : '#fff',
            borderColor:
              selectedCustomAction === action.id ? '#10b981' : isOverlay ? 'rgba(255,255,255,0.7)' : 'var(--color-border, #e2e8f0)',
            color: selectedCustomAction === action.id ? '#064e3b' : '#111827',
            fontWeight: 600,
          }}
          onClick={() => onSelect(action.id)}
        >
          {action.label}
        </button>
      ))}
      {onGenerate360 && (
        <button
          type="button"
          className="button button-secondary"
          disabled={generate360Disabled}
          style={{
            padding: isOverlay ? '0.28rem 0.72rem' : '0.4rem 1rem',
            fontSize: isOverlay ? '0.78rem' : '0.85rem',
            borderRadius: isOverlay ? '999px' : '8px',
            background: isOverlay ? 'rgba(255,255,255,0.92)' : '#fff',
            borderColor: isOverlay ? 'rgba(255,255,255,0.7)' : 'var(--color-border, #e2e8f0)',
            color: '#111827',
            fontWeight: 600,
            opacity: generate360Disabled ? 0.6 : 1,
          }}
          onClick={onGenerate360}
          title={generate360Disabled ? 'Generate a room image first' : 'Generate 360° video'}
        >
          Video
        </button>
      )}
    </div>
  )
}

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
  dining: [
    { id: 'dining_table_set', label: 'Dining table set', description: 'Dining tables and chair sets for meal spaces.' },
    { id: 'dining_chair_set', label: 'Dining chairs', description: 'Standalone dining chair options and finishes.' },
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

/** Base components always shown in Customize (Wall, Floor, Ceiling, Glass partition, Decor). Detected components are merged with these. */
const BASE_CUSTOMIZATION_COMPONENTS = ['wall', 'floor', 'ceiling', 'glass-partition', 'sofa', 'dining', 'decor'] as const

function formatComponentLabel(type: string): string {
  if (type === 'glass-partition') return 'Glass partition'
  if (type === 'dining' || type === 'dinning') return 'Dining'
  if (type === 'mattress') return 'Mattress'
  if (type === 'bed') return 'Bed'
  return type.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

/** Show Bed catalog when the scene or user intent is bedroom-related (detection, Vastu bedroom, or text mentions bedroom). */
const RUG_SLUGS = new Set([
  'rug',
  'carpet',
  'area-rug',
  'runner',
  'runner-rug',
  'dhurrie',
  'bath-mat',
  'bathmat',
  'mat',
])

/** Map detection slugs to customization element keys (rug-like → carpet). */
function normalizeCustomizationComponentSlug(slug: string): string {
  const s = slug.trim().toLowerCase()
  return RUG_SLUGS.has(s) ? 'carpet' : s
}

function shouldOfferBedCustomization(args: {
  detectedSlugs: string[]
  configType: string | null
  vastuRoomType: VastuRoomType
  fullRoomText: string
  optionalReconfigureNotes: string
  arrangementPreferencesText: string
}): boolean {
  if (args.detectedSlugs.includes('bed')) return true
  if (args.configType === 'vastu' && args.vastuRoomType === 'bedroom') return true
  const blob = `${args.fullRoomText}\n${args.optionalReconfigureNotes}\n${args.arrangementPreferencesText}`
  if (/\bbedroom\b/i.test(blob)) return true
  if (/\bbed\b/i.test(blob)) return true
  return false
}

/** Match backend: infer 1/2/3 Seater from product title when DB seating_capacity is empty. */
function inferSofaSeatingFromLabel(label: string): string | undefined {
  const s = label.toLowerCase().replace(/,/g, ' ')
  if (/\b3[\s-]*seater\b/.test(s) || /\bthree[\s-]*seater\b/.test(s)) return '3 Seater'
  if (/\b2[\s-]*seater\b/.test(s) || /\btwo[\s-]*seater\b/.test(s)) return '2 Seater'
  if (/\b1[\s-]*seater\b/.test(s) || /\bone[\s-]*seater\b/.test(s) || /\bsingle[\s-]*seater\b/.test(s)) return '1 Seater'
  return undefined
}

/** Option shape: id, label, description, optional color/material/texture/finish, optional imageUrl (for tiles), seating_capacity (for sofas). */
export type CustomizationOption = {
  id: string
  label: string
  description: string
  color?: string
  material?: string
  texture?: string
  finish?: string
  imageUrl?: string
  seating_capacity?: string
}

/** Options for a component: Supabase variations (e.g. mytyles_vitrified_tiles for floor/wall, sofa_products for sofa, mattress_products for mattress, bed_products for bed) or CUSTOMIZATION_LIBRARY fallback. Sofa, mattress, and bed use API only. */
function getOptionsForComponent(
  type: string,
  productVariations: Partial<Record<string, CustomizationOption[]>>,
): CustomizationOption[] {
  if (type === 'sofa') return productVariations['sofa'] ?? []
  if (type === 'mattress') return productVariations['mattress'] ?? []
  if (type === 'bed') return productVariations['bed'] ?? []
  if (type === 'carpet' || type === 'rug') return productVariations['carpet'] ?? productVariations['rug'] ?? []
  if (productVariations[type]?.length) return productVariations[type]!
  if (type in CUSTOMIZATION_LIBRARY) return CUSTOMIZATION_LIBRARY[type as CustomElementType]
  return []
}

/** Shared: component chips, style/erase UI, summary — used in Step 4A (pre-first-gen) or on result card (after generation). */
function InternalCustomizationPanel({
  customizationComponentList,
  selectedElementType,
  setSelectedElementType,
  selectedCustomAction,
  customStyles,
  setCustomStyles,
  customActions,
  setCustomActions,
  setCustomHistory,
  componentEraseAwaitingConfirm,
  setComponentEraseAwaitingConfirm,
  productVariations,
  loadingVariations,
  hasCustomizationSelection,
  eraseRegionSelection,
  eraseRegionCommitted,
  resultPreviewImageUrl,
  selectIdSuffix,
  sectionTitle,
  onApplyCustomization,
  applyCustomizationDisabled,
  applyCustomizationPending,
}: {
  customizationComponentList: string[]
  selectedElementType: string | null
  setSelectedElementType: (t: string) => void
  selectedCustomAction: CustomAction
  customStyles: Record<string, string | null>
  setCustomStyles: Dispatch<SetStateAction<Record<string, string | null>>>
  customActions: Record<string, CustomAction | null>
  setCustomActions: Dispatch<SetStateAction<Record<string, CustomAction | null>>>
  setCustomHistory: Dispatch<SetStateAction<Record<string, string | null>[]>>
  componentEraseAwaitingConfirm: string | null
  setComponentEraseAwaitingConfirm: Dispatch<SetStateAction<string | null>>
  productVariations: Partial<Record<string, CustomizationOption[]>>
  loadingVariations: boolean
  hasCustomizationSelection: boolean
  eraseRegionSelection: EraseRegion | null
  /** Region erase counts toward Generate only after user confirms magnified preview */
  eraseRegionCommitted: boolean
  /** Full result thumbnail for component-erase confirmation (optional) */
  resultPreviewImageUrl?: string | null
  selectIdSuffix: string
  sectionTitle?: string
  /** Regenerate using selections (same as Step 6A Generate). */
  onApplyCustomization?: () => void
  applyCustomizationDisabled?: boolean
  applyCustomizationPending?: boolean
}) {
  const pendingRegionErase = Boolean(eraseRegionSelection && !eraseRegionCommitted && selectedCustomAction === 'erase')
  return (
    <>
      {sectionTitle ? (
        <h4 style={{ margin: '0 0 0.65rem', fontSize: '1rem', color: '#0f172a' }}>{sectionTitle}</h4>
      ) : null}
      {pendingRegionErase ? (
        <p
          className="hint-text"
          style={{
            marginBottom: '0.65rem',
            padding: '0.55rem 0.75rem',
            borderRadius: 8,
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(217, 119, 6, 0.35)',
            fontSize: '0.85rem',
            color: '#92400e',
          }}
        >
          <strong>Region erase:</strong> confirm the <strong>magnified preview</strong> above (purple box) before Generate.{' '}
          <strong>Component tabs</strong> below are separate — they remove a <em>named</em> item (wall, chair…), not the rectangle you drew.
        </p>
      ) : null}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {customizationComponentList.map((type) => (
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
            onClick={() => {
              setSelectedElementType(type)
              if (selectedCustomAction === 'erase') {
                if (customStyles[type] === '__erase__') {
                  setComponentEraseAwaitingConfirm(null)
                } else {
                  setComponentEraseAwaitingConfirm(type)
                }
              }
            }}
          >
            {formatComponentLabel(type)}
          </button>
        ))}
      </div>
      {selectedElementType && (
        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
          {selectedCustomAction === 'erase' ? (
            <>
              <div className="label" style={{ marginBottom: '0.35rem' }}>
                {formatComponentLabel(selectedElementType)} — {customActionDisplayLabel(selectedCustomAction)}
              </div>
              <div style={{ marginTop: '0.3rem' }}>
              {customStyles[selectedElementType] === '__erase__' ? (
                <>
                  <p className="hint-text" style={{ marginBottom: '0.5rem' }}>
                    <strong>{formatComponentLabel(selectedElementType)}</strong> is marked for removal.{' '}
                    {onApplyCustomization ? (
                      <>
                        Click <strong>Apply customization</strong> below to apply, or undo below.
                      </>
                    ) : (
                      <>
                        Run <strong>Generate</strong> in Step 6A to apply, or undo below.
                      </>
                    )}
                  </p>
                  <button
                    type="button"
                    className="button button-secondary"
                    style={{ borderColor: '#64748b' }}
                    onClick={() => {
                      setCustomHistory((prev) => [...prev, { ...customStyles }])
                      setCustomActions((prev) => ({ ...prev, [selectedElementType]: null }))
                      setCustomStyles((prev) => ({ ...prev, [selectedElementType]: null }))
                      setComponentEraseAwaitingConfirm(null)
                    }}
                  >
                    Undo removal mark for {formatComponentLabel(selectedElementType)}
                  </button>
                </>
              ) : componentEraseAwaitingConfirm === selectedElementType ? (
                <div
                  role="dialog"
                  aria-labelledby={`erase-confirm-heading-${selectIdSuffix}`}
                  style={{
                    marginTop: '0.25rem',
                    padding: '1rem 1.1rem',
                    borderRadius: '12px',
                    border: '2px solid rgba(239, 68, 68, 0.45)',
                    background: 'rgba(254, 242, 242, 0.95)',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                  }}
                >
                  <h4 id={`erase-confirm-heading-${selectIdSuffix}`} style={{ margin: '0 0 0.5rem', fontSize: '1rem', color: '#991b1b' }}>
                    Remove this component?
                  </h4>
                  {resultPreviewImageUrl ? (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <p className="hint-text" style={{ marginBottom: '0.35rem', fontSize: '0.82rem' }}>
                        Preview — your current result (target: <strong>{formatComponentLabel(selectedElementType)}</strong>). The model uses this scene plus the label; it does not auto-detect pixels.
                      </p>
                      <img
                        src={resultPreviewImageUrl}
                        alt={`Current room result; confirming removal of ${formatComponentLabel(selectedElementType)}`}
                        style={{
                          width: '100%',
                          maxHeight: 200,
                          objectFit: 'contain',
                          borderRadius: 10,
                          border: '1px solid rgba(148, 163, 184, 0.5)',
                          background: '#0f172a',
                        }}
                      />
                    </div>
                  ) : null}
                  <p style={{ margin: '0 0 0.35rem', fontSize: '0.9rem', color: '#1e293b' }}>
                    You selected <strong>{formatComponentLabel(selectedElementType)}</strong>. The AI will try to remove this element from your image while keeping room layout and camera the same.
                  </p>
                  <p className="hint-text" style={{ marginBottom: '0.75rem', fontSize: '0.82rem' }}>
                    Is this what you want to erase? If not, choose <strong>No</strong> and tap another component tab (e.g. Coffee table instead of Wall).
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setComponentEraseAwaitingConfirm(null)}
                    >
                      No — I&apos;ll pick another component
                    </button>
                    <button
                      type="button"
                      className="button"
                      style={{
                        background: '#b91c1c',
                        borderColor: '#991b1b',
                        color: '#fff',
                      }}
                      onClick={() => {
                        setCustomHistory((prev) => [...prev, { ...customStyles }])
                        setCustomActions((prev) => ({ ...prev, [selectedElementType]: 'erase' }))
                        setCustomStyles((prev) => ({ ...prev, [selectedElementType]: '__erase__' }))
                        setComponentEraseAwaitingConfirm(null)
                      }}
                    >
                      Yes — mark {formatComponentLabel(selectedElementType)} for removal
                    </button>
                  </div>
                </div>
              ) : (
                <p className="hint-text" style={{ marginTop: '0.15rem' }}>
                  Tap a <strong>component tab</strong> above (e.g. Coffee table). You&apos;ll see a preview and must confirm before anything is marked for removal — or use the <strong>Erase on this result</strong> tab on the image to draw a purple box.
                </p>
              )}
            </div>
            </>
          ) : (
            <fieldset style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
              <legend className="label" style={{ padding: 0, marginBottom: '0.35rem' }}>
                {formatComponentLabel(selectedElementType)} — {customActionDisplayLabel(selectedCustomAction)} — choose a look
              </legend>
              <CustomizationStyleGrid
                variant={
                  selectedElementType === 'sofa' ||
                  selectedElementType === 'mattress' ||
                  selectedElementType === 'bed' ||
                  selectedElementType === 'carpet' ||
                  selectedElementType === 'rug'
                    ? 'large'
                    : 'compact'
                }
                options={getOptionsForComponent(selectedElementType, productVariations)}
                value={
                  customStyles[selectedElementType] === '__erase__'
                    ? ''
                    : (customStyles[selectedElementType] ?? '')
                }
                onChange={(id) => {
                  setCustomHistory((prev) => [...prev, { ...customStyles }])
                  if (id) {
                    setCustomActions((prev) => ({ ...prev, [selectedElementType]: selectedCustomAction }))
                  }
                  setCustomStyles((prev) => ({ ...prev, [selectedElementType]: id }))
                }}
                loading={loadingVariations}
                emptyMessage="No styles available for this component yet."
              />
            </fieldset>
          )}
        </div>
      )}
      {(hasCustomizationSelection || eraseRegionSelection) && (
        <div style={{ marginBottom: '0.25rem', padding: '0.6rem 0.75rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '0.85rem' }}>
          <strong style={{ color: '#0f766e' }}>Selected customizations</strong>
          <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.2rem', color: '#134e4a' }}>
            {eraseRegionSelection ? (
              <li>
                {eraseRegionCommitted
                  ? 'Erase region: confirmed — this rectangle will be inpainted when you Generate'
                  : 'Erase region: draw done — confirm the magnified preview above'}
              </li>
            ) : null}
            {Object.keys(customStyles).map((type) => {
              const id = customStyles[type]
              if (id == null) return null
              const action = customActions[type] ?? 'edit'
              const label = id === '__erase__'
                ? 'Erase'
                : getOptionsForComponent(type, productVariations).find((o) => o.id === id)?.label ?? id
              return <li key={type}>{formatComponentLabel(type)} ({action}): {label}</li>
            })}
          </ul>
          {onApplyCustomization ? (
            <div style={{ marginTop: '0.65rem' }}>
              <button
                type="button"
                className="button button-primary"
                disabled={Boolean(applyCustomizationDisabled)}
                style={{
                  background: '#0d9488',
                  borderColor: '#0f766e',
                  color: '#fff',
                  fontWeight: 600,
                }}
                onClick={() => onApplyCustomization()}
              >
                {applyCustomizationPending ? (
                  <>
                    <span className="spinner" aria-hidden style={{ marginRight: '0.35rem' }} />
                    Regenerating…
                  </>
                ) : (
                  'Apply customization'
                )}
              </button>
              <p className="hint-text" style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: '#475569' }}>
                Regenerates the image using your layout, current result (when available), and the selections above.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </>
  )
}

/** Exterior category chips, catalog grid, summary, Apply — Step 4B and under-result (customization mode). */
function ExternalCustomizationPanel({
  selectedExternalCategory,
  setSelectedExternalCategory,
  externalCustomization,
  setExternalCustomization,
  externalCustomHistory,
  setExternalCustomHistory,
  externalProductVariations,
  loadingExternalVariations,
  onApplyCustomization,
  applyCustomizationDisabled,
  applyCustomizationPending,
  sectionTitle,
  eraseRegionSelection,
  eraseRegionCommitted,
}: {
  selectedExternalCategory: ExternalCategory | null
  setSelectedExternalCategory: Dispatch<SetStateAction<ExternalCategory | null>>
  externalCustomization: ExternalCustomizationState
  setExternalCustomization: Dispatch<SetStateAction<ExternalCustomizationState>>
  externalCustomHistory: ExternalCustomizationState[]
  setExternalCustomHistory: Dispatch<SetStateAction<ExternalCustomizationState[]>>
  externalProductVariations: Partial<Record<ExternalCategory, StyleGridOption[]>>
  loadingExternalVariations: boolean
  onApplyCustomization: () => void
  applyCustomizationDisabled: boolean
  applyCustomizationPending: boolean
  sectionTitle?: string
  eraseRegionSelection?: EraseRegion | null
  eraseRegionCommitted?: boolean
}) {
  const hasExtCatalog = EXTERNAL_CATEGORIES.some(
    (cat) => externalCustomization[cat] != null && externalCustomization[cat] !== ''
  )
  const showApplyBlock = hasExtCatalog || Boolean(eraseRegionSelection)
  return (
    <>
      {sectionTitle ? (
        <h4 style={{ margin: '0 0 0.65rem', fontSize: '1rem', color: '#0f172a' }}>{sectionTitle}</h4>
      ) : null}
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
              background: selectedExternalCategory === cat ? 'rgba(13, 148, 136, 0.12)' : undefined,
              borderColor: selectedExternalCategory === cat ? 'var(--color-primary)' : undefined,
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
            <strong>{EXTERNAL_CATEGORY_LABELS[selectedExternalCategory]} — catalog</strong>
          </p>
          <CustomizationStyleGrid
            variant="compact"
            options={
              externalProductVariations[selectedExternalCategory]?.length
                ? externalProductVariations[selectedExternalCategory]!
                : EXTERNAL_CUSTOMIZATION_PRESETS[selectedExternalCategory]
            }
            value={externalCustomization[selectedExternalCategory] ?? ''}
            onChange={(id) => {
              setExternalCustomHistory((prev) => [...prev, { ...externalCustomization }])
              setExternalCustomization((prev) => ({
                ...prev,
                [selectedExternalCategory]: id,
              }))
            }}
            loading={loadingExternalVariations}
            emptyMessage="No catalog entries for this category."
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem', marginTop: '0.5rem' }}>
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
              disabled={externalCustomHistory.length === 0}
              onClick={() => {
                setExternalCustomHistory((prev) => {
                  if (prev.length === 0) return prev
                  const last = prev[prev.length - 1]
                  setExternalCustomization(last)
                  return prev.slice(0, prev.length - 1)
                })
              }}
            >
              Undo last change
            </button>
          </div>
        </>
      )}
      {showApplyBlock && (
        <div
          style={{
            marginBottom: '0.75rem',
            marginTop: '0.75rem',
            padding: '0.6rem 0.75rem',
            background: 'rgba(16, 185, 129, 0.08)',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: '0.85rem',
          }}
        >
          <strong style={{ color: '#0f766e' }}>Selected exterior styles</strong>
          <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.2rem', color: '#134e4a' }}>
            {eraseRegionSelection ? (
              <li>
                {eraseRegionCommitted
                  ? 'Erase region: confirmed — this rectangle will be inpainted when you Generate'
                  : 'Erase region: draw done — confirm the magnified preview above'}
              </li>
            ) : null}
            {EXTERNAL_CATEGORIES.map((cat) => {
              const id = externalCustomization[cat]
              if (id == null || id === '') return null
              const opts = externalProductVariations[cat]?.length
                ? externalProductVariations[cat]!
                : EXTERNAL_CUSTOMIZATION_PRESETS[cat]
              const label = opts.find((o) => o.id === id)?.label ?? id
              return (
                <li key={cat}>
                  {EXTERNAL_CATEGORY_LABELS[cat]}: {label}
                </li>
              )
            })}
          </ul>
          <div style={{ marginTop: '0.65rem' }}>
            <button
              type="button"
              className="button button-primary"
              disabled={applyCustomizationDisabled}
              style={{
                background: '#0d9488',
                borderColor: '#0f766e',
                color: '#fff',
                fontWeight: 600,
              }}
              onClick={() => onApplyCustomization()}
            >
              {applyCustomizationPending ? (
                <>
                  <span className="spinner" aria-hidden style={{ marginRight: '0.35rem' }} />
                  Regenerating…
                </>
              ) : (
                'Apply customization'
              )}
            </button>
            <p className="hint-text" style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: '#475569' }}>
              Regenerates using your layout, current result when available, and the exterior selections above.
            </p>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Main page component for the AI Room Configuration System
 * Flow: Step 1 = Select Configuration Type (Internal/External) → Upload → AI Detection → Config Mode → Generate
 */
export default function Home() {
  const lastGenerationRequestRef = useRef<{ key: string; at: number } | null>(null)
  const DUPLICATE_GENERATION_WINDOW_MS = 12000

  // Step 1: Configuration type (must select before upload)
  const [configType, setConfigType] = useState<ConfigType>(null)

  // State for uploaded images (base64 strings)
  const [images, setImages] = useState<string[]>([])
  
  // State for configuration mode: full room, component-based, or customization (internal & external)
  const [configMode, setConfigMode] = useState<'purpose' | 'arrangement' | 'customization'>('purpose')

  // Style selection (Step 4): applied to both interior and exterior flows
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [selectedColorPalette, setSelectedColorPalette] = useState<string | null>(null)
  
  // State for Full Room Configuration: reference image(s) and single combined text (purpose + preferences)
  const [fullRoomReferenceImages, setFullRoomReferenceImages] = useState<string[]>([])
  const [fullRoomText, setFullRoomText] = useState('')
  /** Optional Step 4: extra notes + style reference images (bedroom/kitchen cues, etc.) */
  const [optionalReconfigureNotes, setOptionalReconfigureNotes] = useState('')
  const [optionalReconfigureReferenceImages, setOptionalReconfigureReferenceImages] = useState<string[]>([])
  
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
  // Original image from API (no watermark) – kept for backend/edit flows and reapplying watermark if needed.
  const [generatedImageOriginal, setGeneratedImageOriginal] = useState<string | null>(null)
  // Whether the displayed result currently has the watermark applied.
  const [showWatermark, setShowWatermark] = useState(true)
  // For before/after comparison: layout reference (first time) or image before customization (each customization loop)
  const [comparisonBeforeImageUrl, setComparisonBeforeImageUrl] = useState<string | null>(null)
  // History of generated images for undo (last configuration/customization)
  const [generatedImageHistory, setGeneratedImageHistory] = useState<string[]>([])
  // Generation history: last N generated results (newest first), for browsing and reloading
  const [generationHistory, setGenerationHistory] = useState<string[]>([])
  /** Same order/length as generationHistory: API image (no watermark) for each version — fixes slider/findIndex when user toggles watermark */
  const [generationHistoryOriginal, setGenerationHistoryOriginal] = useState<string[]>([])
  const MAX_GENERATION_HISTORY = 20
  // Stable key for comparison slider: increment when "after" image changes so slider remounts and never stacks layers
  const [comparisonSliderKey, setComparisonSliderKey] = useState(0)
  /** When true, show room editor instead of the default before/after preview (no separate “Compare” tab). */
  const [showDirectEditPanel, setShowDirectEditPanel] = useState(false)
  // State for user favourites (saved generated images)
  const [favoriteImages, setFavoriteImages] = useState<string[]>([])
  
  // State for loading and errors
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  // Image type validation: strict mode check for all uploaded images
  const [imageTypeValidation, setImageTypeValidation] = useState<{
    valid: boolean
    message: string
    invalidImageIndices?: number[]
  } | null>(null)
  const [isValidatingImageType, setIsValidatingImageType] = useState(false)

  // Post-generation visual customization (Customize mode)
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [isEditingStylePalette, setIsEditingStylePalette] = useState(false)
  /** Internal & external: after each generate, user must finalize style before Customize/Add/Replace/Erase on the result. */
  const [styleFinalizeGatePassed, setStyleFinalizeGatePassed] = useState(false)
  const [showStyleReviewPanel, setShowStyleReviewPanel] = useState(false)
  const [lastAppliedStylePaletteKey, setLastAppliedStylePaletteKey] = useState('')
  const {
    selectedElementType,
    setSelectedElementType,
    customStyles,
    setCustomStyles,
    customActions,
    setCustomActions,
    selectedCustomAction,
    setSelectedCustomAction,
    customHistory,
    setCustomHistory,
    eraseRegionSelection,
    setEraseRegionSelection,
    eraseRegionConfirmed,
    setEraseRegionConfirmed,
    componentEraseAwaitingConfirm,
    setComponentEraseAwaitingConfirm,
    externalCustomization,
    setExternalCustomization,
    selectedExternalCategory,
    setSelectedExternalCategory,
    externalCustomHistory,
    setExternalCustomHistory,
    resetCustomization,
  } = useCustomization()
  const [customClickPosition, setCustomClickPosition] = useState<{ x: number; y: number } | null>(null)
  // Dynamic component list: base (wall, floor, ceiling, glass-partition, decor) + detected from generated image
  const [detectedCustomizationComponents, setDetectedCustomizationComponents] = useState<string[]>([])
  const [isDetectingComponents, setIsDetectingComponents] = useState(false)
  const customizationComponentList = useMemo(() => {
    const normalizedSlugs = Array.from(
      new Set(detectedCustomizationComponents.map(normalizeCustomizationComponentSlug)),
    )
    const detected = normalizedSlugs.filter(
      (c) => !(BASE_CUSTOMIZATION_COMPONENTS as readonly string[]).includes(c),
    )
    let merged = [...BASE_CUSTOMIZATION_COMPONENTS, ...detected]
    const offerBed = shouldOfferBedCustomization({
      detectedSlugs: detectedCustomizationComponents,
      configType,
      vastuRoomType: vastuPreferences.roomType,
      fullRoomText,
      optionalReconfigureNotes,
      arrangementPreferencesText: arrangementConfig.arrangementPreferencesText,
    })
    if (offerBed && !merged.includes('bed')) {
      const sofaIdx = merged.indexOf('sofa')
      if (sofaIdx !== -1) {
        merged = [...merged.slice(0, sofaIdx + 1), 'bed', ...merged.slice(sofaIdx + 1)]
      } else {
        merged = [...merged, 'bed']
      }
    }
    const bedIdx = merged.indexOf('bed')
    if (bedIdx !== -1 && !merged.includes('mattress')) {
      return [...merged.slice(0, bedIdx + 1), 'mattress', ...merged.slice(bedIdx + 1)]
    }
    return merged
  }, [
    detectedCustomizationComponents,
    configType,
    vastuPreferences.roomType,
    fullRoomText,
    optionalReconfigureNotes,
    arrangementConfig.arrangementPreferencesText,
  ])
  // Product variations from Supabase (by component type). Supports any string key for dynamic components.
  const [productVariations, setProductVariations] = useState<Partial<Record<string, CustomizationOption[]>>>({})
  const [loadingVariations, setLoadingVariations] = useState(false)

  /** Room editor store: live canvas image for Add/Replace/Erase (lift-style) on the result. */
  const liftWorkingImage = useRoomEditorStore((s) => s.workingImage)
  // External: product_variations from Supabase by category (facade, window, door, etc.)
  const [externalProductVariations, setExternalProductVariations] = useState<
    Partial<Record<ExternalCategory, StyleGridOption[]>>
  >({})
  const [loadingExternalVariations, setLoadingExternalVariations] = useState(false)

  /** Wizard: current step (1 = type, 2 = upload, 3 = layout reference, 4 = configure & generate) */
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1)
  /** Index of the uploaded image chosen as layout reference (locks structure/camera). Null until user selects in step 3. */
  const [layoutReferenceImageIndex, setLayoutReferenceImageIndex] = useState<number | null>(null)
  const generationHistoryPanelRef = useRef<HTMLDivElement | null>(null)
  /** Generation history card is hidden until user clicks History in the preview toolbar. */
  const [showGenerationHistoryPanel, setShowGenerationHistoryPanel] = useState(false)
  const [tourStartSignal, setTourStartSignal] = useState(0)
  /** In customization mode after finalize: hide layout/config/generate; user can expand to edit. */
  const [customizationSetupExpanded, setCustomizationSetupExpanded] = useState(false)

  useWizardState({
    apply: {
      setConfigType,
      setConfigMode,
      setWizardStep,
      setLayoutReferenceImageIndex,
      setImages,
      setSelectedStyle,
      setSelectedColorPalette,
      setFullRoomText,
      setFullRoomReferenceImages,
      setVastuEnabled,
      setVastuPreferences,
      setGeneratedImage,
      setGeneratedImageOriginal,
      setShowWatermark,
    },
    deps: [
      configType,
      configMode,
      wizardStep,
      layoutReferenceImageIndex,
      images,
      selectedStyle,
      selectedColorPalette,
      fullRoomText,
      fullRoomReferenceImages,
      vastuEnabled,
      vastuPreferences,
      generatedImage,
      generatedImageOriginal,
      showWatermark,
      customStyles,
      customActions,
      selectedCustomAction,
      customHistory,
      eraseRegionSelection,
      eraseRegionConfirmed,
      componentEraseAwaitingConfirm,
      externalCustomization,
      selectedExternalCategory,
      externalCustomHistory,
    ],
    getSnapshot: () => ({
      configType,
      configMode,
      wizardStep,
      layoutReferenceImageIndex,
      images,
      selectedStyle,
      selectedColorPalette,
      fullRoomText,
      fullRoomReferenceImages,
      vastuEnabled,
      vastuPreferences,
      generatedImage,
      generatedImageOriginal,
      showWatermark,
    }),
  })

  /**
   * Handle configuration type change (Step 1)
   */
  const handleConfigTypeChange = (type: ConfigType) => {
    setConfigType(type)
    setConfigMode('purpose')
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
    setDetectedCustomizationComponents([])
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
    resetCustomization()
    setCustomClickPosition(null)
    setSelectedStyle(null)
    setSelectedColorPalette(null)
    setStyleFinalizeGatePassed(false)
    setShowStyleReviewPanel(false)
    setLastAppliedStylePaletteKey('')
    setShowDirectEditPanel(false)
    setWizardStep(1)
    setLayoutReferenceImageIndex(null)
    setOptionalReconfigureNotes('')
    setOptionalReconfigureReferenceImages([])
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
    setDetectedCustomizationComponents([])
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
    setOptionalReconfigureNotes('')
    setOptionalReconfigureReferenceImages([])
    setGeneratedImage(null)
    setGeneratedImageOriginal(null)
    setShowWatermark(true)
    setComparisonBeforeImageUrl(null)
    setGeneratedImageHistory([])
    setGenerationHistory([])
    setGenerationHistoryOriginal([])
    setShowGenerationHistoryPanel(false)
    setFavoriteImages([])
    setIsGenerating(false)
    setError(null)
    setWarning(null)
    setImageTypeValidation(null)
    setIsCustomizing(false)
    resetCustomization()
    setCustomClickPosition(null)
    setSelectedStyle(null)
    setSelectedColorPalette(null)
    setIsEditingStylePalette(false)
    setStyleFinalizeGatePassed(false)
    setShowStyleReviewPanel(false)
    setLastAppliedStylePaletteKey('')
    setShowDirectEditPanel(false)
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
      if (configMode === 'customization') {
        setStyleFinalizeGatePassed(true)
        setLastAppliedStylePaletteKey(stylePaletteKey(null, null))
      } else {
        setStyleFinalizeGatePassed(false)
        setLastAppliedStylePaletteKey('')
      }
      setShowStyleReviewPanel(false)
      setShowDirectEditPanel(false)
      setIsCustomizing(false)
      resetCustomization()
      setCustomClickPosition(null)
    }
    if (configMode === 'arrangement') {
      setDetectedComponents([])
      setDetectedCustomizationComponents([])
      setComponentDecisions({})
      setAddNewComponents(null)
      setAnalysisFullReport(null)
    }
  }

  /**
   * Handle configuration mode change
   */
  const handleConfigModeChange = (mode: 'purpose' | 'arrangement' | 'customization') => {
    setConfigMode(mode)
    if (mode === 'customization') {
      setOptionalReconfigureNotes('')
      setOptionalReconfigureReferenceImages([])
      setSelectedStyle(null)
      setSelectedColorPalette(null)
      setLastAppliedStylePaletteKey(stylePaletteKey(null, null))
      setStyleFinalizeGatePassed(true)
      setShowStyleReviewPanel(false)
      useRoomEditorStore.getState().setEditOptions({
        selectedStyleId: undefined,
        selectedColorPaletteId: undefined,
      })
    }
    setGeneratedImage(null)
    setGeneratedImageOriginal(null)
    setShowWatermark(true)
    setComparisonBeforeImageUrl(null)
    setFavoriteImages([])
    if (mode !== 'customization') {
      setStyleFinalizeGatePassed(false)
      setShowStyleReviewPanel(false)
      setLastAppliedStylePaletteKey('')
    }
    setShowDirectEditPanel(false)
    if (mode !== 'arrangement') {
      setAddNewComponents(null)
    }
    setIsCustomizing(false)
    if (mode === 'customization') {
      if (configType === 'external') {
        setSelectedExternalCategory((c) => c ?? EXTERNAL_CATEGORIES[0])
        setSelectedElementType(null)
      } else {
        setSelectedElementType(BASE_CUSTOMIZATION_COMPONENTS[0] ?? 'wall')
      }
    } else {
      setSelectedElementType(null)
    }
    setSelectedCustomAction('edit')
    if (mode !== 'customization') {
      setCustomActions({})
    }
    setCustomHistory([])
    setComponentEraseAwaitingConfirm(null)
    setEraseRegionSelection(null)
    setEraseRegionConfirmed(false)
  }

  const applyRoomEditorResultToGeneration = useCallback(
    async (newImageUrl: string) => {
      try {
        const watermarkedUrl = await applyWatermarkToImage(newImageUrl)
        setGeneratedImage(watermarkedUrl)
        setGeneratedImageOriginal(newImageUrl)
        setShowWatermark(true)
      } catch {
        // Fallback: show unwatermarked if watermarking fails
        setGeneratedImage(newImageUrl)
        setGeneratedImageOriginal(newImageUrl)
        setShowWatermark(false)
      }
      // Do not append room-editor "Apply" as a new generated version.
      // History versions should represent explicit Generate/Regenerate actions only.
      setComparisonSliderKey((k) => k + 1)
    },
    []
  )

  /** Customize / Add / Replace / Erase in Step 4A — clears component-erase preview when leaving Erase. */
  const handleCustomizationActionInStep4 = useCallback((action: CustomAction) => {
    setSelectedCustomAction(action)
    if (action === 'add' || action === 'replace' || action === 'erase') {
      useRoomEditorStore.getState().setMode(action)
      setEraseRegionSelection(null)
      setEraseRegionConfirmed(false)
    } else {
      useRoomEditorStore.getState().setMode('idle')
    }
    if (configType !== 'internal' && configType !== 'external') return
    // Don’t auto-open component confirmation (e.g. Wall) — user picks a tab when they mean component erase
    setComponentEraseAwaitingConfirm(null)
  }, [configType])

  /** From under-result bar: set action and enter the right UI without clearing the current image (unlike handleConfigModeChange). */
  const handleCustomizationActionFromResult = useCallback(
    (action: CustomAction) => {
      setSelectedCustomAction(action)
      if (action === 'add' || action === 'replace' || action === 'erase') {
        useRoomEditorStore.getState().setMode(action)
        setEraseRegionSelection(null)
        setEraseRegionConfirmed(false)
      } else {
        useRoomEditorStore.getState().setMode('idle')
      }
      if (configType === 'internal') {
        if (action !== 'erase') {
          setComponentEraseAwaitingConfirm(null)
        }
        if (configMode !== 'customization') {
          setConfigMode('customization')
          const nextEl = selectedElementType ?? BASE_CUSTOMIZATION_COMPONENTS[0] ?? 'wall'
          setSelectedElementType(nextEl)
        }
        // Erase: lift-style tools below; scroll to result tools
        if (action === 'erase') setComponentEraseAwaitingConfirm(null)
        if (action === 'add' || action === 'replace' || action === 'erase') {
          requestAnimationFrame(() => {
            const anchor =
              generatedImageOriginal ?? generatedImage ? 'result-output-anchor' : 'step-5a-erase-anchor'
            document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          })
        }
      } else if (configType === 'external') {
        if (action !== 'erase') {
          setComponentEraseAwaitingConfirm(null)
        }
        if (configMode !== 'customization') {
          setConfigMode('customization')
          setSelectedExternalCategory((c) => c ?? EXTERNAL_CATEGORIES[0])
          setSelectedElementType(null)
        }
        if (action === 'erase') setComponentEraseAwaitingConfirm(null)
        if (action === 'add' || action === 'replace' || action === 'erase') {
          requestAnimationFrame(() => {
            const anchor =
              generatedImageOriginal ?? generatedImage
                ? 'result-output-anchor'
                : 'step-5b-external-erase-anchor'
            document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          })
        }
      }
    },
    [configType, configMode, selectedElementType, generatedImage, generatedImageOriginal]
  )

  // Min images: internal 4+, external 3+
  const minImages = 4
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
      // Send all uploaded images (cap 6) so validation can require every photo to match the mode.
      const imagesToValidate = images.slice(0, 6)
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
          let data: { valid?: boolean; message?: string; invalidImageIndices?: number[] } = {}
          try {
            data = JSON.parse(text)
          } catch {
            if (!res.ok) return { valid: false, message: text || 'Validation failed.', invalidImageIndices: imagesToValidate.map((_, idx) => idx) }
          }
          return {
            valid: res.ok && data.valid === true,
            message: data?.message || (res.ok ? 'Images match.' : 'Image type does not match configuration.'),
            invalidImageIndices: Array.isArray(data?.invalidImageIndices) ? data.invalidImageIndices : [],
          }
        })
        .then((data) => {
          if (cancelled) return
          setImageTypeValidation({
            valid: data.valid === true,
            message: data.message || '',
            invalidImageIndices: data.invalidImageIndices || [],
          })
        })
        .catch(() => {
          if (!cancelled) {
            setImageTypeValidation({
              valid: false,
              message: "We couldn't verify your images. Please try again.",
              invalidImageIndices: imagesToValidate.map((_, idx) => idx),
            })
          }
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
          return JSON.parse(text) as { id: string; label: string; description: string; color?: string; material?: string; texture?: string; finish?: string; imageUrl?: string }[]
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
          return JSON.parse(text) as {
            id: string
            label: string
            description: string
            color?: string
            material?: string
            texture?: string
            finish?: string
            imageUrl?: string
          }[]
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

  /** Convert any image URL (data:, blob:, https:) to a data URL so the detect-components API can use it. */
  const toDataUrlForDetection = useCallback(async (url: string): Promise<string | null> => {
    if (!url) return null
    if (url.startsWith('data:')) return url
    try {
      const res = await fetch(url, { mode: 'cors' })
      if (!res.ok) return null
      const blob = await res.blob()
      return new Promise<string | null>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => (typeof reader.result === 'string' ? resolve(reader.result) : resolve(null))
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(blob)
      })
    } catch {
      return null
    }
  }, [])

  /** Run component detection on the generated image and set detected components for the Customize panel. Accepts data URL, blob URL, or https URL (will convert to data URL). */
  const runComponentDetection = useCallback(async (imageUrl: string) => {
    if (!imageUrl) return
    const dataUrl = imageUrl.startsWith('data:')
      ? imageUrl
      : await toDataUrlForDetection(imageUrl)
    if (!dataUrl || !dataUrl.startsWith('data:')) return
    setIsDetectingComponents(true)
    fetch('/api/detect-components', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl }),
    })
      .then((res) => (res.ok ? res.json() : { components: [] }))
      .then((data: { components?: string[] }) => {
        const list = Array.isArray(data?.components) ? data.components : []
        setDetectedCustomizationComponents(list)
      })
      .catch(() => setDetectedCustomizationComponents([]))
      .finally(() => setIsDetectingComponents(false))
  }, [toDataUrlForDetection])

  /**
   * Custom room components: seed the layout reference as the first preview so Edit / Add / Replace / Erase
   * work immediately — no full-room style, palette, or AI generate pass required.
   */
  useEffect(() => {
    if (configType !== 'internal' && configType !== 'external') return
    if (configMode !== 'customization') return
    if (wizardStep !== 4) return
    if (layoutReferenceImageIndex == null) return
    const layoutUrl = images[layoutReferenceImageIndex]
    if (!layoutUrl) return
    if (generatedImageOriginal != null || generatedImage != null) return

    let cancelled = false
    void (async () => {
      try {
        const watermarkedUrl = await applyWatermarkToImage(layoutUrl)
        if (cancelled) return
        setGeneratedImage(watermarkedUrl)
        setGeneratedImageOriginal(layoutUrl)
        setShowWatermark(true)
        setStyleFinalizeGatePassed(true)
        setLastAppliedStylePaletteKey(stylePaletteKey(null, null))
        setComparisonSliderKey((k) => k + 1)
        runComponentDetection(watermarkedUrl.startsWith('data:') ? watermarkedUrl : layoutUrl)
      } catch {
        if (cancelled) return
        setGeneratedImage(layoutUrl)
        setGeneratedImageOriginal(layoutUrl)
        setShowWatermark(false)
        setStyleFinalizeGatePassed(true)
        setLastAppliedStylePaletteKey(stylePaletteKey(null, null))
        setComparisonSliderKey((k) => k + 1)
        runComponentDetection(layoutUrl)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [
    configType,
    configMode,
    wizardStep,
    layoutReferenceImageIndex,
    images,
    generatedImage,
    generatedImageOriginal,
    runComponentDetection,
  ])

  /** Toggle favourite for the current image (heart on image). Add if not in list, remove if already favourited. */
  const toggleFavorite = (imageUrl: string | null) => {
    if (!imageUrl) return
    setFavoriteImages((prev) =>
      prev.includes(imageUrl) ? prev.filter((u) => u !== imageUrl) : [...prev, imageUrl]
    )
  }

  const handleShareGeneratedResult = useCallback(async () => {
    const url = generatedImage
    if (!url) return
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const mime = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/png'
      const file = new File([blob], `room-configuration-${Date.now()}.png`, { type: mime })
      if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'AI room configuration' })
        return
      }
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: 'AI room configuration', text: 'Room configuration preview' })
        return
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return
      console.warn(e)
    }
    try {
      await navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.href : '')
      alert('Page link copied. Use Download to save the image file.')
    } catch {
      alert('Use Download to save this image.')
    }
  }, [generatedImage])

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
    const required = 4
    if (images.length < required) {
      setError(configType === 'internal'
        ? 'Please upload at least 4 images of the room.'
        : 'Please upload at least 4 external images (front, side/back, compound).')
      return
    }

    // Validate configuration based on mode (purpose: style is sufficient; ref images/text optional)
    if (configMode === 'purpose') {
      const hasRefImages =
        fullRoomReferenceImages.length > 0 || optionalReconfigureReferenceImages.length > 0
      const hasText = fullRoomText.trim().length > 0
      const hasOptionalNotes = optionalReconfigureNotes.trim().length > 0
      const hasStyle = selectedStyle != null && selectedStyle.trim().length > 0
      if (!hasRefImages && !hasText && !hasOptionalNotes && !hasStyle) {
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

    if (configMode === 'customization') {
      const eraseReady = Boolean(eraseRegionSelection && eraseRegionConfirmed)
      const hasInternalPick = Object.values(customStyles).some((v) => v != null && v !== '')
      const hasExternalPick =
        configType === 'external' &&
        EXTERNAL_CATEGORIES.some((cat) => externalCustomization[cat] != null && externalCustomization[cat] !== '')
      const hasCustomizationSelectionInner = hasInternalPick || hasExternalPick || eraseReady
      if (!hasCustomizationSelectionInner) {
        if (eraseRegionSelection && !eraseRegionConfirmed) {
          setError('Confirm your erase region: use the magnified preview and tap “Yes — this is the area to remove”.')
        } else {
          setError(
            configType === 'external'
              ? 'Please select at least one exterior category (facade, gate, etc.), or draw and confirm an area to erase on the image.'
              : 'Please select at least one component style, or draw and confirm an area to erase on the image.'
          )
        }
        return
      }
    }
    if (configMode === 'purpose' && configType === 'internal') {
      const hasCustomizationSelection = Object.values(customStyles).some((v) => v != null && v !== '')
      const hasSelectedStyle = selectedStyle != null && selectedStyle.trim() !== ''
      if (!hasSelectedStyle && !hasCustomizationSelection) {
        setError('Please select a Style, or select at least one component (e.g. wall/floor tile) in Full Room mode.')
        return
      }
    }
    if (configMode === 'purpose' && configType === 'external') {
      const hasSelectedStyle = selectedStyle != null && selectedStyle.trim() !== ''
      const hasExternalCustomizationSelection = EXTERNAL_CATEGORIES.some(
        (cat) => externalCustomization[cat] != null && externalCustomization[cat] !== ''
      )
      if (!hasSelectedStyle && !hasExternalCustomizationSelection) {
        setError('Please select a Style, or select at least one external category (e.g. Facade/Gate) in Full External mode.')
        return
      }
    }

    // Guard against accidental automatic duplicate generations with unchanged inputs.
    const requestKey = JSON.stringify({
      configType,
      configMode,
      imageCount: images.length,
      layoutReferenceImageIndex,
      selectedStyle: selectedStyle ?? '',
      selectedColorPalette: selectedColorPalette ?? '',
      fullRoomText: fullRoomText.trim(),
      fullRoomReferenceCount: fullRoomReferenceImages.length,
      arrangementConfig,
      componentReferenceCount: componentReferenceImages.length,
      componentReferenceLabels: componentReferenceLabels.map((l) => l.trim()),
      customStyles,
      customActions,
      externalCustomization,
      eraseRegionSelection,
      eraseRegionConfirmed,
      hasCurrentResultImage: Boolean(generatedImageOriginal ?? generatedImage),
    })
    const nowTs = Date.now()
    const lastReq = lastGenerationRequestRef.current
    if (lastReq && lastReq.key === requestKey && nowTs - lastReq.at < DUPLICATE_GENERATION_WINDOW_MS) {
      console.log('[Generate] Duplicate request ignored (same inputs within cooldown window).')
      return
    }
    lastGenerationRequestRef.current = { key: requestKey, at: nowTs }

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
      // Style-only regeneration: user changed style/palette while customizing and clicked Regenerate — send current result so the new style is applied to this image (works for both Full Room and Arrangement modes)
      const hasStyleOrPalette = (selectedStyle != null && selectedStyle.trim() !== '') || (selectedColorPalette != null && selectedColorPalette.trim() !== '')
      const useCurrentResultForStyleRegenerate = hasStyleOrPalette && !!(generatedImageOriginal ?? generatedImage)
      // For comparison: show "before customization" vs "after customization"; set before to current result now
      if ((hasCustomization || useCurrentResultForStyleRegenerate) && generatedImage) {
        setComparisonBeforeImageUrl(generatedImage)
      }
      // Build human-readable labels for each selected customization style so the AI gets
      // real descriptions instead of opaque IDs like "decor_plants_green".
      const resolvedCustomizationLabels: Record<
        string,
        { label: string; description: string; isDecor: boolean; action?: CustomAction; referenceImageUrl?: string; seatingCapacity?: string }
      > = {}
      if (configType !== 'external') {
        Object.entries(customStyles).forEach(([elementType, optionId]) => {
          if (!optionId) return
          const action = customActions[elementType] ?? (elementType === 'decor' ? 'add' : 'edit')
          if (optionId === '__erase__') {
            resolvedCustomizationLabels[elementType] = {
              label: 'Erase',
              description: `Remove ${formatComponentLabel(elementType)} from the room while preserving layout and camera framing.`,
              isDecor: false,
              action: 'erase',
            }
            return
          }
          const opts = getOptionsForComponent(elementType, productVariations)
          const opt = opts.find((o) => o.id === optionId)
          if (opt) {
            resolvedCustomizationLabels[elementType] = {
              label: opt.label,
              description: opt.description,
              isDecor: action === 'add' || elementType === 'decor',
              action,
              ...(opt.imageUrl &&
              (elementType === 'floor' ||
                elementType === 'wall' ||
                elementType === 'sofa' ||
                elementType === 'mattress' ||
                elementType === 'bed' ||
                elementType === 'carpet' ||
                elementType === 'rug')
                ? { referenceImageUrl: opt.imageUrl }
                : {}),
              ...(elementType === 'sofa'
                ? (() => {
                    const cap =
                      (opt as CustomizationOption).seating_capacity || inferSofaSeatingFromLabel(opt.label)
                    return cap ? { seatingCapacity: cap } : {}
                  })()
                : {}),
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
        fullRoomAdditionalText:
          (configMode === 'purpose' || configMode === 'arrangement') && optionalReconfigureNotes.trim()
            ? optionalReconfigureNotes.trim()
            : undefined,
        optionalReferenceImages:
          (configMode === 'purpose' || configMode === 'arrangement') &&
          optionalReconfigureReferenceImages.length > 0
            ? optionalReconfigureReferenceImages
            : undefined,
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
        // Image-based erase: normalized rect (0–1). Backend will inpaint this region (only after user confirms preview).
        ...(configType === 'internal' && eraseRegionSelection && eraseRegionConfirmed
          ? { eraseRegion: eraseRegionSelection }
          : {}),
        // Send current result when applying component customizations, style-only regenerate, or image-based erase
        ...((hasCustomization || useCurrentResultForStyleRegenerate || (eraseRegionSelection && eraseRegionConfirmed)) &&
        (generatedImageOriginal ?? generatedImage)
          ? { currentResultImage: generatedImageOriginal ?? generatedImage }
          : {}),
      }

      // Call the API route
      const response = await postJsonWithRetry('/api/generate', payload)
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
      // Comparison view: replace the single "after" image (never append); slider shows before + this only
      setGeneratedImage(watermarkedUrl)
      setComparisonSliderKey((k) => k + 1)
      setGenerationHistory((prev) => [watermarkedUrl, ...prev.slice(0, MAX_GENERATION_HISTORY - 1)])
      setGenerationHistoryOriginal((prev) => [imageUrl, ...prev.slice(0, MAX_GENERATION_HISTORY - 1)])
      // Clear image-based erase selection after successful apply so user can draw a new one if needed
      if (eraseRegionSelection) {
        setEraseRegionSelection(null)
        setEraseRegionConfirmed(false)
      }
      // Run component extraction on the generated image so Customize shows base + detected components (shelf, table, chair, etc.)
      runComponentDetection(watermarkedUrl.startsWith('data:') ? watermarkedUrl : imageUrl)
      // First generation (no customization): comparison left = layout reference
      if (!hasCustomization && images.length > 0) {
        const layoutIdx = layoutReferenceImageIndex ?? 0
        setComparisonBeforeImageUrl(images[layoutIdx])
      }
      if (configType === 'internal' || configType === 'external') {
        setLastAppliedStylePaletteKey(stylePaletteKey(selectedStyle, selectedColorPalette))
        setStyleFinalizeGatePassed(false)
        setShowStyleReviewPanel(false)
        setShowDirectEditPanel(false)
        setIsEditingStylePalette(false)
      }
    } catch (err) {
      // Failed requests can be retried immediately by user.
      lastGenerationRequestRef.current = null
      const msg =
        err instanceof Error && err.name === 'AbortError'
          ? 'Generation timed out or was interrupted. Check your connection and try again.'
          : err instanceof Error
            ? err.message
            : 'An error occurred'
      setError(msg)
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

      const response = await postJsonWithRetry('/api/generate', payload)

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
      setComparisonSliderKey((k) => k + 1)
      setGenerationHistory((prev) => [watermarkedUrl, ...prev.slice(0, MAX_GENERATION_HISTORY - 1)])
      setGenerationHistoryOriginal((prev) => [imageUrl, ...prev.slice(0, MAX_GENERATION_HISTORY - 1)])
      runComponentDetection(watermarkedUrl.startsWith('data:') ? watermarkedUrl : imageUrl)
    } catch (err) {
      const msg =
        err instanceof Error && err.name === 'AbortError'
          ? 'Generation timed out or was interrupted. Check your connection and try again.'
          : err instanceof Error
            ? err.message
            : 'An error occurred'
      setError(msg)
    } finally {
      setIsGenerating(false)
    }
  }

  // When user opens Customize and we have a generated image but no detected components yet, run extraction on the current image (e.g. retry after failure or late-open)
  useEffect(() => {
    if (isCustomizing && generatedImage && detectedCustomizationComponents.length === 0 && !isDetectingComponents) {
      runComponentDetection(generatedImage)
    }
  }, [isCustomizing, generatedImage, detectedCustomizationComponents.length, isDetectingComponents, runComponentDetection])

  /** Under-slider UI already shows Customize / Components — hide duplicate “Customize” panel from result-actions. */
  useEffect(() => {
    if (
      (configType === 'internal' || configType === 'external') &&
      configMode === 'customization'
    ) {
      setIsCustomizing(false)
    }
  }, [configType, configMode])

  /** New or changed rectangle → require confirmation again */
  useEffect(() => {
    setEraseRegionConfirmed(false)
  }, [eraseRegionSelection])

  /** Rectangle erase and component erase are independent — don’t auto-open “Wall” while user is using the box tool */
  useEffect(() => {
    if (eraseRegionSelection) setComponentEraseAwaitingConfirm(null)
  }, [eraseRegionSelection])

  useEffect(() => {
    if (generationHistory.length === 0) setShowGenerationHistoryPanel(false)
  }, [generationHistory.length])

  // Check if generation button should be enabled (requires config type + enough images + mode requirements)
  const hasEnoughImages = configType != null && images.length >= 4
  const imageTypeOk =
    configType === 'vastu' || imageTypeValidation === null || imageTypeValidation.valid
  const hasSelectedStyle = selectedStyle != null && selectedStyle.trim() !== ''
  const eraseRegionReady = Boolean(eraseRegionSelection && eraseRegionConfirmed)
  const hasCustomizationSelection =
    Object.values(customStyles).some((v) => v != null && v !== '') || eraseRegionReady
  const hasExternalCustomizationSelection =
    configType === 'external' &&
    EXTERNAL_CATEGORIES.some((cat) => externalCustomization[cat] != null && externalCustomization[cat] !== '')
  const hasAnyComponentSelection = hasCustomizationSelection || hasExternalCustomizationSelection
  const lockedLayoutImage =
    layoutReferenceImageIndex != null && images[layoutReferenceImageIndex]
      ? images[layoutReferenceImageIndex]
      : (images[0] ?? null)
  /** Must match API inpaint source: current result when refining, else layout (see /api/generate erase branch). */
  const erasePaintImageSrc =
    (generatedImageOriginal ?? generatedImage) ?? lockedLayoutImage ?? null
  /** After at least one successful room image exists, component/erase controls live on the result card (not duplicated in Step 4A). */
  const hasRoomGenerationResult = !!(generatedImageOriginal ?? generatedImage)

  useRoomEditorImageSync({
    selectedCustomAction,
    generatedImage,
    generatedImageOriginal,
    lockedLayoutImage,
  })

  // For purpose mode: style is required, reference images/text are optional (user can generate with just style)
  // For arrangement mode: style is required, plus component decisions and refs if adding new components
  const canGenerate =
    configType != null &&
    configType !== 'vastu' &&
    hasEnoughImages &&
    imageTypeOk &&
    layoutReferenceImageIndex != null &&
    (configMode === 'customization'
      ? true
      : configMode === 'purpose'
      ? (hasSelectedStyle || hasAnyComponentSelection)
      : hasSelectedStyle) &&
    (configMode === 'purpose'
      ? true // Style is sufficient; reference images/text are optional
      : configMode === 'customization'
      ? hasCustomizationSelection || hasExternalCustomizationSelection
      : addNewComponents !== null &&
        (addNewComponents === false ||
          (componentReferenceImages.length > 0 &&
            componentReferenceLabels.some((l) => l && l.trim().length > 0))))

  const styleReviewGateActive =
    (configType === 'internal' || configType === 'external') &&
    Boolean(generatedImage) &&
    !isGenerating &&
    !styleFinalizeGatePassed

  /** Only enable Regenerate when something has actually changed since the last applied style/palette or customization. */
  const stylePaletteKeyCurrent = stylePaletteKey(selectedStyle, selectedColorPalette)
  const hasPendingStyleOrPaletteChange =
    (configType === 'internal' || configType === 'external') &&
    hasRoomGenerationResult &&
    stylePaletteKeyCurrent !== lastAppliedStylePaletteKey
  const canRegenerateWithChanges =
    (configType === 'vastu'
      ? true
      : hasCustomizationSelection || hasExternalCustomizationSelection || hasPendingStyleOrPaletteChange) &&
    canGenerate

  const customizationFocusCompact =
    (configType === 'internal' || configType === 'external') &&
    configMode === 'customization' &&
    styleFinalizeGatePassed &&
    hasRoomGenerationResult
  const hideCustomizationWizardSetup = customizationFocusCompact && !customizationSetupExpanded

  const acceptStyleReviewAndUnlock = useCallback(() => {
    setStyleFinalizeGatePassed(true)
    setCustomizationSetupExpanded(false)
    setShowStyleReviewPanel(false)
    useRoomEditorStore.getState().setEditOptions({
      selectedStyleId: selectedStyle ?? undefined,
      selectedColorPaletteId: selectedColorPalette ?? undefined,
    })
  }, [selectedStyle, selectedColorPalette])

  const finalizeStyleReviewFromPanel = useCallback(() => {
    if (configType !== 'internal' && configType !== 'external') return
    const key = stylePaletteKey(selectedStyle, selectedColorPalette)
    if (key !== lastAppliedStylePaletteKey && !canGenerate) {
      setError('Cannot regenerate: confirm layout image and required steps, then try again.')
      return
    }
    // Do not auto-generate here; this button now only unlocks customization.
    // Users must click Regenerate explicitly to create a new version with the updated style/palette.
    setStyleFinalizeGatePassed(true)
    setCustomizationSetupExpanded(false)
    setShowStyleReviewPanel(false)
    useRoomEditorStore.getState().setEditOptions({
      selectedStyleId: selectedStyle ?? undefined,
      selectedColorPaletteId: selectedColorPalette ?? undefined,
    })
  }, [configType, selectedStyle, selectedColorPalette, lastAppliedStylePaletteKey, canGenerate])

  const handleGenerateTourVideo = useCallback(() => {
    setTourStartSignal((s) => s + 1)
    requestAnimationFrame(() => {
      document.getElementById('room-immersive-tour-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }, [])

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
              Images: {images.length} / 6 (min 4)
            </span>
            {configType != null && configType !== 'vastu' && (
              <span className="status-pill">
                Mode: {configMode === 'purpose'
                  ? (configType === 'external' ? 'Full external' : 'Full room')
                  : configMode === 'customization'
                  ? 'Custom room components'
                  : 'Component-based'}
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
                invalidImageIndices={
                  (configType === 'internal' || configType === 'external') && imageTypeValidation && !imageTypeValidation.valid
                    ? (imageTypeValidation.invalidImageIndices ?? [])
                    : []
                }
                hintText={
                  configType === 'internal'
                    ? 'Upload 4–6 clear photos of the same room from different angles (front, back, left, right, diagonals). Avoid blurry or very dark images.'
                    : configType === 'external'
                    ? 'Upload 4–6 images: front elevation, side/back views, and compound or open area. Clear daylight photos work best.'
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
                      onClick={() => {
                        if (layoutReferenceImageIndex === index) return
                        setLayoutReferenceImageIndex(index)
                        if (configMode === 'customization') {
                          setGeneratedImage(null)
                          setGeneratedImageOriginal(null)
                          setGenerationHistory([])
                          setGenerationHistoryOriginal([])
                          setComparisonBeforeImageUrl(null)
                        }
                      }}
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
            {hideCustomizationWizardSetup && (
              <div
                className="card"
                style={{
                  padding: '0.65rem 1rem',
                  marginBottom: '0.85rem',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '0.75rem',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: '0.88rem', color: '#475569' }}>
                    Layout, mode, style steps, and the main generate card are hidden so you can focus on{' '}
                    <strong>Components</strong> and tools under your preview.
                  </span>
                  <button
                    type="button"
                    className="button button-secondary"
                    style={{ fontSize: '0.82rem' }}
                    onClick={() => setCustomizationSetupExpanded(true)}
                  >
                    Show layout &amp; setup
                  </button>
                </div>
              </div>
            )}
            {!hideCustomizationWizardSetup && (
              <>
            <div
              className="wizard-nav wizard-nav-top"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setWizardStep(3)}
              >
                ← Back to layout reference
              </button>
              {customizationFocusCompact && customizationSetupExpanded && (
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => setCustomizationSetupExpanded(false)}
                >
                  Hide layout &amp; setup
                </button>
              )}
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
              </>
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
            ) : hideCustomizationWizardSetup ? null : (
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

                {(configMode === 'purpose' || configMode === 'arrangement') && (
                  <OptionalReconfigureHints
                    notes={optionalReconfigureNotes}
                    onNotesChange={setOptionalReconfigureNotes}
                    referenceImages={optionalReconfigureReferenceImages}
                    onReferenceImagesChange={setOptionalReconfigureReferenceImages}
                    variant={configType === 'external' ? 'external' : 'internal'}
                    disabled={isGenerating}
                  />
                )}

                {/* Step 5: Reference images for new components (arrangement only) */}
                {configMode === 'arrangement' && (
                  <div className="card">
                    <div className="step-label">{configType === 'internal' ? '🏠 STEP 5A' : '🏡 STEP 5B'}</div>
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

                {/* (Full Room / External configuration card removed as per latest request) */}
                {configMode === 'customization' && configType === 'internal' && (
                  <div className="card">
                    <div className="step-label">🏠 STEP 5A</div>
                    <div className="step-title-row">
                      <h2>Custom Room Components</h2>
                    </div>
                    {hasRoomGenerationResult ? (
                      <p className="hint-text" style={{ marginBottom: '0.75rem' }}>
                        <strong>Custom configuration</strong> skips room style and palette. Your layout photo is the starting image — use{' '}
                        <strong>Edit</strong>, <strong>Add</strong>, <strong>Replace</strong>, and <strong>Erase</strong> under the preview. Optional: pick
                        component looks here or in Step 6A and use <strong>Apply customization</strong> / <strong>Generate</strong>.
                      </p>
                    ) : (
                      <>
                        <p className="hint-text" style={{ marginBottom: '0.75rem' }}>
                          Select component styles below. Layout and camera stay unchanged.{' '}
                          <strong>Use &quot;Apply customization&quot;</strong> under your selection summary, or <strong>&quot;Generate Room Configuration&quot;</strong> in Step 6A.
                        </p>
                        {lockedLayoutImage && (
                          <div style={{ marginBottom: '0.9rem' }} id="step-5a-erase-anchor">
                            {selectedCustomAction === 'erase' && erasePaintImageSrc ? (
                              <>
                                <p className="hint-text" style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                                  Draw on your layout image to choose a rectangle to remove on <strong>first</strong> generation. After you have a result, region erase moves to the image below.
                                </p>
                                <EraseRegionSelector
                                  imageSrc={erasePaintImageSrc}
                                  value={eraseRegionSelection}
                                  onChange={setEraseRegionSelection}
                                />
                                {eraseRegionSelection && erasePaintImageSrc ? (
                                  <RegionEraseConfirmPanel
                                    imageSrc={erasePaintImageSrc}
                                    region={eraseRegionSelection}
                                    confirmed={eraseRegionConfirmed}
                                    onConfirm={() => setEraseRegionConfirmed(true)}
                                    onRedraw={() => {
                                      setEraseRegionSelection(null)
                                      setEraseRegionConfirmed(false)
                                    }}
                                  />
                                ) : null}
                              </>
                            ) : (
                              <div
                                style={{
                                  position: 'relative',
                                  borderRadius: '12px',
                                  overflow: 'hidden',
                                  border: '1px solid var(--color-border)',
                                  background: '#000',
                                }}
                              >
                                <img
                                  src={lockedLayoutImage}
                                  alt="Locked layout reference"
                                  style={{ display: 'block', width: '100%', height: 'auto', objectFit: 'contain' }}
                                />
                                <div
                                  style={{
                                    position: 'absolute',
                                    left: '8px',
                                    right: '8px',
                                    bottom: '10px',
                                    transform: 'none',
                                    background: 'rgba(15, 23, 42, 0.75)',
                                    backdropFilter: 'blur(3px)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '14px',
                                    padding: '0.35rem 0.45rem',
                                  }}
                                >
                                  <CustomizationModeActionButtons
                                    selectedCustomAction={selectedCustomAction}
                                    onSelect={handleCustomizationActionInStep4}
                                    variant="overlay"
                                    onGenerate360={handleGenerateTourVideo}
                                    generate360Disabled={!hasRoomGenerationResult || styleReviewGateActive || isGenerating}
                                  />
                                </div>
                              </div>
                            )}
                            {selectedCustomAction === 'erase' && (
                              <div style={{ marginTop: '0.5rem' }}>
                                <CustomizationModeActionButtons
                                  selectedCustomAction={selectedCustomAction}
                                  onSelect={handleCustomizationActionInStep4}
                                  variant="overlay"
                                  onGenerate360={handleGenerateTourVideo}
                                  generate360Disabled={!hasRoomGenerationResult || styleReviewGateActive || isGenerating}
                                />
                              </div>
                            )}
                          </div>
                        )}
                        <InternalCustomizationPanel
                          customizationComponentList={customizationComponentList}
                          selectedElementType={selectedElementType}
                          setSelectedElementType={setSelectedElementType}
                          selectedCustomAction={selectedCustomAction}
                          customStyles={customStyles}
                          setCustomStyles={setCustomStyles}
                          customActions={customActions}
                          setCustomActions={setCustomActions}
                          setCustomHistory={setCustomHistory}
                          componentEraseAwaitingConfirm={componentEraseAwaitingConfirm}
                          setComponentEraseAwaitingConfirm={setComponentEraseAwaitingConfirm}
                          productVariations={productVariations}
                          loadingVariations={loadingVariations}
                          hasCustomizationSelection={hasCustomizationSelection}
                          eraseRegionSelection={eraseRegionSelection}
                          eraseRegionCommitted={eraseRegionConfirmed}
                          resultPreviewImageUrl={null}
                          selectIdSuffix="step4"
                          onApplyCustomization={() => void handleGenerate()}
                          applyCustomizationDisabled={!canGenerate || isGenerating || styleReviewGateActive}
                          applyCustomizationPending={isGenerating}
                        />
                      </>
                    )}
                  </div>
                )}

                {configMode === 'customization' && configType === 'external' && (
                  <div className="card">
                    <div className="step-label">🏡 STEP 5B</div>
                    <div className="step-title-row">
                      <h2>Custom exterior components</h2>
                    </div>
                    {hasRoomGenerationResult ? (
                      <p className="hint-text" style={{ marginBottom: '0.75rem' }}>
                        <strong>Custom configuration</strong> skips exterior style and palette. Your reference photo is the starting image — use{' '}
                        <strong>Edit</strong>, <strong>Add</strong>, <strong>Replace</strong>, and <strong>Erase</strong> under the preview. Optional:
                        exterior presets below or <strong>Generate External Configuration</strong> in Step 6B.
                      </p>
                    ) : (
                      <>
                        <p className="hint-text" style={{ marginBottom: '0.75rem' }}>
                          Choose facade, windows, entrance, and other exterior categories below. Layout and camera stay unchanged.{' '}
                          <strong>Use &quot;Apply customization&quot;</strong> when ready, or <strong>Generate External Configuration</strong> in
                          Step 6B.
                        </p>
                        {lockedLayoutImage && (
                          <div style={{ marginBottom: '0.9rem' }} id="step-5b-external-erase-anchor">
                            {selectedCustomAction === 'erase' && erasePaintImageSrc ? (
                              <>
                                <p className="hint-text" style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                                  Draw on your reference image to mark a rectangle to remove on <strong>first</strong> generation. After you have a
                                  result, use erase on the generated image.
                                </p>
                                <EraseRegionSelector
                                  imageSrc={erasePaintImageSrc}
                                  value={eraseRegionSelection}
                                  onChange={setEraseRegionSelection}
                                />
                                {eraseRegionSelection && erasePaintImageSrc ? (
                                  <RegionEraseConfirmPanel
                                    imageSrc={erasePaintImageSrc}
                                    region={eraseRegionSelection}
                                    confirmed={eraseRegionConfirmed}
                                    onConfirm={() => setEraseRegionConfirmed(true)}
                                    onRedraw={() => {
                                      setEraseRegionSelection(null)
                                      setEraseRegionConfirmed(false)
                                    }}
                                  />
                                ) : null}
                              </>
                            ) : (
                              <div
                                style={{
                                  position: 'relative',
                                  borderRadius: '12px',
                                  overflow: 'hidden',
                                  border: '1px solid var(--color-border)',
                                  background: '#000',
                                }}
                              >
                                <img
                                  src={lockedLayoutImage}
                                  alt="Locked exterior reference"
                                  style={{ display: 'block', width: '100%', height: 'auto', objectFit: 'contain' }}
                                />
                                <div
                                  style={{
                                    position: 'absolute',
                                    left: '8px',
                                    right: '8px',
                                    bottom: '10px',
                                    transform: 'none',
                                    background: 'rgba(15, 23, 42, 0.75)',
                                    backdropFilter: 'blur(3px)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '14px',
                                    padding: '0.35rem 0.45rem',
                                  }}
                                >
                                  <CustomizationModeActionButtons
                                    selectedCustomAction={selectedCustomAction}
                                    onSelect={handleCustomizationActionInStep4}
                                    variant="overlay"
                                    onGenerate360={handleGenerateTourVideo}
                                    generate360Disabled={!hasRoomGenerationResult || styleReviewGateActive || isGenerating}
                                  />
                                </div>
                              </div>
                            )}
                            {selectedCustomAction === 'erase' && (
                              <div style={{ marginTop: '0.5rem' }}>
                                <CustomizationModeActionButtons
                                  selectedCustomAction={selectedCustomAction}
                                  onSelect={handleCustomizationActionInStep4}
                                  variant="overlay"
                                  onGenerate360={handleGenerateTourVideo}
                                  generate360Disabled={!hasRoomGenerationResult || styleReviewGateActive || isGenerating}
                                />
                              </div>
                            )}
                          </div>
                        )}
                        <ExternalCustomizationPanel
                          selectedExternalCategory={selectedExternalCategory}
                          setSelectedExternalCategory={setSelectedExternalCategory}
                          externalCustomization={externalCustomization}
                          setExternalCustomization={setExternalCustomization}
                          externalCustomHistory={externalCustomHistory}
                          setExternalCustomHistory={setExternalCustomHistory}
                          externalProductVariations={externalProductVariations}
                          loadingExternalVariations={loadingExternalVariations}
                          onApplyCustomization={() => void handleGenerate()}
                          applyCustomizationDisabled={!canGenerate || isGenerating || styleReviewGateActive}
                          applyCustomizationPending={isGenerating}
                          eraseRegionSelection={eraseRegionSelection}
                          eraseRegionCommitted={eraseRegionConfirmed}
                        />
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Generate — hidden in customization focus mode (apply from Components under preview) */}
            {!(
              hideCustomizationWizardSetup &&
              (configType === 'internal' || configType === 'external')
            ) && (
            <div className="card">
              <div className="step-label">
                {configType === 'internal'
                  ? '🏠 STEP 6A'
                  : configType === 'external'
                  ? '🏡 STEP 6B'
                  : '🧭 STEP 6C'}
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
            )}

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

            {/* Result: before/after is default; optional erase tabs inside slider; direct customize (tools) opens separately */}
            {generatedImage && !isGenerating && (
              <div className="card" id="result-output-anchor">
                {showDirectEditPanel ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => setShowDirectEditPanel(false)}
                      >
                        ← Back to before &amp; after
                      </button>
                    </div>
                    {(configType === 'internal' || configType === 'external') && !styleFinalizeGatePassed ? (
                      <div
                        style={{
                          padding: '2rem 1.5rem',
                          textAlign: 'center',
                          borderRadius: 12,
                          border: '1px dashed #94a3b8',
                          background: '#f8fafc',
                          color: '#475569',
                        }}
                      >
                        <p style={{ margin: '0 0 1rem', fontSize: '0.95rem', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                          Finalize your style from the preview first (use the toolbar above the image). Then open <strong>Direct customize</strong> again.
                        </p>
                        <button type="button" className="button button-primary" onClick={() => setShowDirectEditPanel(false)}>
                          Back to preview
                        </button>
                      </div>
                    ) : (
                      <>
                        <RoomEditorWorkbench
                          imageUrl={generatedImageOriginal ?? generatedImage}
                          onApply={(url) => void applyRoomEditorResultToGeneration(url)}
                        />
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className="button button-secondary"
                            onClick={async () => {
                              try {
                                await downloadImageWithLogo(generatedImage, `room-configuration-${Date.now()}.png`)
                              } catch (e) {
                                console.error(e)
                                alert('Failed to download image.')
                              }
                            }}
                          >
                            💾 Download image
                          </button>
                          <button type="button" className="button button-secondary" onClick={() => setShowDirectEditPanel(false)}>
                            Back to before &amp; after
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                <>
                {(configType === 'internal' || configType === 'external') &&
                  styleFinalizeGatePassed &&
                  !styleReviewGateActive && (
                  <div style={{ marginBottom: '0.65rem', display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => setShowDirectEditPanel(true)}
                      style={{ fontSize: '0.85rem' }}
                    >
                      Customize (tools)
                    </button>
                  </div>
                )}
                {styleReviewGateActive && (
                  <div
                    style={{
                      marginBottom: '1rem',
                      padding: '1rem 1.15rem',
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%)',
                      border: '1px solid #99f6e4',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        color: '#0d9488',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Step 1 — Review result
                    </div>
                    <h3 style={{ fontSize: '1.02rem', margin: '0 0 0.35rem', color: '#0f766e' }}>Happy with this look?</h3>
                    <p className="hint-text" style={{ marginBottom: 0, fontSize: '0.88rem', lineHeight: 1.45 }}>
                      Use the <strong>toolbar above the preview</strong>: <strong>Finalize &amp; continue</strong>, <strong>Adjust style</strong>,{' '}
                      <strong>Download</strong>, and more. After changing style in the side panel, tap <strong>Finalize style</strong> at the top of
                      that panel.
                    </p>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: styleReviewGateActive ? 'column' : 'row',
                    gap: '1.5rem',
                    alignItems: 'stretch',
                    flexWrap: styleReviewGateActive ? 'nowrap' : 'wrap',
                    width: '100%',
                  }}
                >
                      <div
                        style={{
                          flex: styleReviewGateActive ? '0 0 auto' : '1 1 400px',
                          minWidth: styleReviewGateActive ? '100%' : '260px',
                          maxWidth: '100%',
                          width: styleReviewGateActive ? '100%' : undefined,
                          display: styleReviewGateActive && showStyleReviewPanel ? 'grid' : 'block',
                          gridTemplateColumns:
                            styleReviewGateActive && showStyleReviewPanel
                              ? 'minmax(0, 1fr) minmax(280px, min(380px, 100%))'
                              : undefined,
                          gap: styleReviewGateActive && showStyleReviewPanel ? '1.25rem' : undefined,
                          alignItems: 'start',
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                        {/* Single output view: before vs after with draggable slider; heart on image to favourite */}
                        {(images.length > 0 || comparisonBeforeImageUrl) && (
                          <div className="before-after-section before-after-primary" style={{ position: 'relative' }}>
                        <h3 className="before-after-heading">Before &amp; after</h3>
                        {(() => {
                          /* generationHistory[0] = newest … history[length-1] = oldest (v1). Slider: previous version vs selected. */
                          const layoutRefUrl =
                            images.length > 0 ? images[layoutReferenceImageIndex ?? 0] : ''
                          const historyIdx =
                            generatedImage == null
                              ? -1
                              : generationHistory.findIndex((wm, i) => {
                                  const orig = generationHistoryOriginal[i]
                                  const disp = generatedImage
                                  const co = generatedImageOriginal
                                  if (disp != null && (wm === disp || orig === disp)) return true
                                  if (co != null && (wm === co || orig === co)) return true
                                  return false
                                })
                          const beforeFromVersionChain =
                            historyIdx >= 0 && historyIdx < generationHistory.length - 1
                              ? generationHistory[historyIdx + 1]
                              : null
                          /* v1 (oldest in history): always compare original layout → v1. Don’t use comparisonBeforeImageUrl (that may be a snapshot of v1 from when v2 was generated, so both sides match v1). */
                          const isViewingOldestHistoryVersion =
                            historyIdx >= 0 && historyIdx === generationHistory.length - 1
                          const effectiveSliderBeforeUrl = beforeFromVersionChain
                            ? beforeFromVersionChain
                            : isViewingOldestHistoryVersion
                              ? layoutRefUrl
                              : (comparisonBeforeImageUrl ?? layoutRefUrl)
                          const currentV =
                            historyIdx >= 0 ? generationHistory.length - historyIdx : null
                          let compareBeforeLabel = 'Before (layout reference)'
                          let compareAfterLabel = 'After (generated)'
                          if (beforeFromVersionChain != null && currentV != null) {
                            compareBeforeLabel = `Before (v${currentV - 1})`
                            compareAfterLabel = `After (v${currentV})`
                          } else if (isViewingOldestHistoryVersion && currentV != null) {
                            compareBeforeLabel = 'Before (layout reference)'
                            compareAfterLabel = `After (v${currentV})`
                          } else if (currentV != null) {
                            compareAfterLabel = `After (v${currentV})`
                            if (
                              comparisonBeforeImageUrl != null &&
                              layoutRefUrl &&
                              comparisonBeforeImageUrl !== layoutRefUrl
                            ) {
                              compareBeforeLabel = 'Before (before customization)'
                              compareAfterLabel = 'After (after customization)'
                            }
                          } else if (
                            comparisonBeforeImageUrl != null &&
                            layoutRefUrl &&
                            comparisonBeforeImageUrl !== layoutRefUrl
                          ) {
                            compareBeforeLabel = 'Before (before customization)'
                            compareAfterLabel = 'After (after customization)'
                          }
                          const styleLabel =
                            selectedStyle && (configType === 'internal' || configType === 'external')
                              ? selectedStyle.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                              : undefined
                          const paletteLabel =
                            selectedColorPalette && (configType === 'internal' || configType === 'external')
                              ? selectedColorPalette === 'surprise_me'
                                ? 'Surprise Me'
                                : selectedColorPalette.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                              : undefined
                          const previewToolbar =
                            generatedImage != null ? (
                              <ResultPreviewToolbar
                                styleReviewGateActive={styleReviewGateActive}
                                showStyleReviewPanel={showStyleReviewPanel}
                                onFinalizeStyle={acceptStyleReviewAndUnlock}
                                onToggleAdjustStyle={() => setShowStyleReviewPanel((v) => !v)}
                                onRegenerate={() => {
                                  if (configType === 'vastu') void handleGenerateVastu()
                                  else void handleGenerate()
                                }}
                                regenerateDisabled={
                                  configType === 'vastu'
                                    ? isGenerating || images.length < 4 || layoutReferenceImageIndex == null
                                    : !canRegenerateWithChanges || isGenerating
                                }
                                regeneratePending={isGenerating}
                                styleLabel={styleLabel}
                                paletteLabel={paletteLabel}
                                onShare={() => void handleShareGeneratedResult()}
                                shareDisabled={!generatedImage}
                                onDownload={async () => {
                                  if (!generatedImage) return
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
                                downloadDisabled={!generatedImage}
                                onToggleLike={() => toggleFavorite(generatedImage)}
                                likeDisabled={!generatedImage}
                                liked={favoriteImages.includes(generatedImage)}
                                historyPanelOpen={showGenerationHistoryPanel}
                                onHistory={() => {
                                  if (generationHistory.length === 0) return
                                  setShowGenerationHistoryPanel((open) => {
                                    const next = !open
                                    if (next) {
                                      requestAnimationFrame(() =>
                                        generationHistoryPanelRef.current?.scrollIntoView({
                                          behavior: 'smooth',
                                          block: 'nearest',
                                        })
                                      )
                                    }
                                    return next
                                  })
                                }}
                                historyDisabled={generationHistory.length === 0}
                                onStyle={() => {
                                  if (styleReviewGateActive) setShowStyleReviewPanel(true)
                                  else setIsEditingStylePalette(true)
                                }}
                                styleDisabled={!generatedImage || isGenerating}
                                showStyleButton={configType === 'internal' || configType === 'external'}
                              />
                            ) : undefined
                          return (
                        <BeforeAfterSlider
                          key={comparisonSliderKey}
                          beforeImageUrl={effectiveSliderBeforeUrl}
                          afterImageUrl={generatedImage}
                          beforeLabel={compareBeforeLabel}
                          afterLabel={compareAfterLabel}
                          eraseOnResult={
                            (configType === 'internal' || configType === 'external') &&
                            !styleReviewGateActive &&
                            selectedCustomAction !== 'add' &&
                            selectedCustomAction !== 'replace' &&
                            selectedCustomAction !== 'erase'
                              ? {
                                  value: eraseRegionSelection,
                                  onChange: setEraseRegionSelection,
                                  preferEraseTab: false,
                                }
                              : null
                          }
                          compareTopBar={previewToolbar}
                        />
                          )
                        })()}
                        {(configType === 'internal' || configType === 'external') &&
                          !styleReviewGateActive &&
                          selectedCustomAction === 'erase' &&
                          eraseRegionSelection &&
                          erasePaintImageSrc && (
                            <RegionEraseConfirmPanel
                              imageSrc={erasePaintImageSrc}
                              region={eraseRegionSelection}
                              confirmed={eraseRegionConfirmed}
                              onConfirm={() => setEraseRegionConfirmed(true)}
                              onRedraw={() => {
                                setEraseRegionSelection(null)
                                setEraseRegionConfirmed(false)
                              }}
                            />
                          )}
                        {(configType === 'internal' || configType === 'external') && !styleReviewGateActive && (
                          <div
                            style={{
                              marginTop: '0.75rem',
                              paddingTop: '0.75rem',
                              borderTop: '1px solid var(--color-border, #e2e8f0)',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '0.75rem',
                                flexWrap: 'wrap',
                              }}
                            >
                              <CustomizationModeActionButtons
                                selectedCustomAction={selectedCustomAction}
                                onSelect={handleCustomizationActionFromResult}
                                variant="bar"
                                onGenerate360={handleGenerateTourVideo}
                                generate360Disabled={!hasRoomGenerationResult || styleReviewGateActive || isGenerating}
                              />
                            </div>
                            {(configType === 'internal' || configType === 'external') &&
                              !styleReviewGateActive &&
                              (selectedCustomAction === 'add' ||
                                selectedCustomAction === 'replace' ||
                                selectedCustomAction === 'erase') &&
                              (generatedImageOriginal ?? generatedImage) && (
                                <div
                                  style={{
                                    marginTop: '1rem',
                                    padding: '1rem',
                                    borderRadius: 12,
                                    border: '1px solid var(--color-border, #e2e8f0)',
                                    background: '#f8fafc',
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexWrap: 'wrap',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      gap: '0.75rem',
                                      marginBottom: '0.75rem',
                                    }}
                                  >
                                    <p className="hint-text" style={{ margin: 0, fontSize: '0.88rem', flex: '1 1 220px' }}>
                                      Draw a <strong>box on the image</strong>, choose what to add in the <strong>options panel</strong>, click{' '}
                                      <strong>Add</strong>, review the preview, then <strong>Apply</strong>.
                                    </p>
                                    <HistoryManager />
                                  </div>
                                  <div
                                    className="generating-fixed-layout"
                                    style={{
                                      background: '#f1f5f9',
                                      borderRadius: 12,
                                    }}
                                  >
                                    <CanvasInteraction
                                      imageSrc={
                                        liftWorkingImage ??
                                        (generatedImageOriginal ?? generatedImage) ??
                                        ''
                                      }
                                      className="room-editor-canvas"
                                      fullWidth
                                    />
                                  </div>
                                  <div style={{ marginTop: '0.75rem' }}>
                                    <SelectionModeToolbar />
                                  </div>
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexWrap: 'wrap',
                                      gap: '1.25rem',
                                      alignItems: 'flex-start',
                                      marginTop: '0.75rem',
                                    }}
                                  >
                                    <div style={{ flex: '0 1 340px', width: '100%', maxWidth: 400 }}>
                                      <SidePanel />
                                    </div>
                                    <div style={{ flex: '1 1 280px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                      <PreviewPanel
                                        onApply={async () => {
                                          const img = useRoomEditorStore.getState().workingImage
                                          if (img) await applyRoomEditorResultToGeneration(img)
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            {configType === 'internal' && configMode === 'customization' && (
                              <div
                                id="step-5a-erase-anchor"
                                style={{
                                  marginTop: '1rem',
                                  paddingTop: '1rem',
                                  borderTop: '1px solid var(--color-border, #e2e8f0)',
                                }}
                              >
                                <InternalCustomizationPanel
                                  customizationComponentList={customizationComponentList}
                                  selectedElementType={selectedElementType}
                                  setSelectedElementType={setSelectedElementType}
                                  selectedCustomAction={selectedCustomAction}
                                  customStyles={customStyles}
                                  setCustomStyles={setCustomStyles}
                                  customActions={customActions}
                                  setCustomActions={setCustomActions}
                                  setCustomHistory={setCustomHistory}
                                  componentEraseAwaitingConfirm={componentEraseAwaitingConfirm}
                                  setComponentEraseAwaitingConfirm={setComponentEraseAwaitingConfirm}
                                  productVariations={productVariations}
                                  loadingVariations={loadingVariations}
                                  hasCustomizationSelection={hasCustomizationSelection}
                                  eraseRegionSelection={eraseRegionSelection}
                                  eraseRegionCommitted={eraseRegionConfirmed}
                                  resultPreviewImageUrl={generatedImageOriginal ?? generatedImage}
                                  selectIdSuffix="result"
                                  sectionTitle="Components"
                                  onApplyCustomization={() => void handleGenerate()}
                                  applyCustomizationDisabled={!canGenerate || isGenerating || styleReviewGateActive}
                                  applyCustomizationPending={isGenerating}
                                />
                              </div>
                            )}
                            {configType === 'external' && configMode === 'customization' && (
                              <div
                                id="step-5b-external-result-components-anchor"
                                style={{
                                  marginTop: '1rem',
                                  paddingTop: '1rem',
                                  borderTop: '1px solid var(--color-border, #e2e8f0)',
                                }}
                              >
                                <ExternalCustomizationPanel
                                  selectedExternalCategory={selectedExternalCategory}
                                  setSelectedExternalCategory={setSelectedExternalCategory}
                                  externalCustomization={externalCustomization}
                                  setExternalCustomization={setExternalCustomization}
                                  externalCustomHistory={externalCustomHistory}
                                  setExternalCustomHistory={setExternalCustomHistory}
                                  externalProductVariations={externalProductVariations}
                                  loadingExternalVariations={loadingExternalVariations}
                                  onApplyCustomization={() => void handleGenerate()}
                                  applyCustomizationDisabled={!canGenerate || isGenerating || styleReviewGateActive}
                                  applyCustomizationPending={isGenerating}
                                  sectionTitle="Exterior components"
                                  eraseRegionSelection={eraseRegionSelection}
                                  eraseRegionCommitted={eraseRegionConfirmed}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action bar: watermark, restart, customize (download lives on the before/after preview) */}
                    <div className="result-actions">
                      {generatedImageOriginal != null && (
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={async () => {
                            try {
                              const watermarkedUrl = await applyWatermarkToImage(generatedImageOriginal)
                              setGeneratedImage(watermarkedUrl)
                              setShowWatermark(true)
                            } catch (e) {
                              console.error(e)
                            }
                          }}
                          disabled={isGenerating}
                        >
                          {showWatermark ? 'Reapply watermark' : 'Apply watermark'}
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
                      {!(
                        (configType === 'internal' || configType === 'external') &&
                        configMode === 'customization'
                      ) && (
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => {
                            if (!generatedImage) return
                            setIsCustomizing((v) => {
                              const next = !v
                              if (next) {
                                setCustomClickPosition(null)
                                if (configType === 'internal') setSelectedElementType(customizationComponentList[0] ?? 'wall')
                                else setSelectedElementType(null)
                                if (configType === 'external') setSelectedExternalCategory('facade')
                              }
                              return next
                            })
                          }}
                          disabled={isGenerating || styleReviewGateActive}
                          title={styleReviewGateActive ? 'Finalize your style first' : undefined}
                        >
                          {isCustomizing ? 'Close Customize' : 'Customize'}
                        </button>
                      )}
                      {(configType === 'internal' || configType === 'external') && (generatedImageOriginal ?? generatedImage) && (
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => {
                            setTourStartSignal((s) => s + 1)
                            requestAnimationFrame(() => {
                              document.getElementById('room-immersive-tour-section')?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start',
                              })
                            })
                          }}
                          disabled={isGenerating || styleReviewGateActive}
                          title={styleReviewGateActive ? 'Finalize your style first' : undefined}
                        >
                          🎥 Generate 360° video
                        </button>
                      )}
                      {(configType === 'internal' || configType === 'external') && styleFinalizeGatePassed && (
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

                    {generatedImage &&
                      !isGenerating &&
                      !styleReviewGateActive &&
                      (configType === 'vastu' || styleFinalizeGatePassed) && (
                        <RoomImmersiveTourSection
                          sectionId="room-immersive-tour-section"
                          imageUrl={generatedImageOriginal ?? generatedImage}
                          startSignal={tourStartSignal}
                        />
                      )}

                    {isEditingStylePalette &&
                      (configType === 'internal' || configType === 'external') &&
                      styleFinalizeGatePassed && (
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
                                <CustomizationStyleGrid
                                  variant="compact"
                                  options={
                                    externalProductVariations[selectedExternalCategory]?.length
                                      ? externalProductVariations[selectedExternalCategory]!
                                      : EXTERNAL_CUSTOMIZATION_PRESETS[selectedExternalCategory]
                                  }
                                  value={externalCustomization[selectedExternalCategory] ?? ''}
                                  onChange={(id) => {
                                    setExternalCustomHistory((prev) => [...prev, { ...externalCustomization }])
                                    setExternalCustomization((prev) => ({
                                      ...prev,
                                      [selectedExternalCategory]: id,
                                    }))
                                  }}
                                  loading={loadingExternalVariations}
                                  emptyMessage="No catalog entries for this category."
                                />
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
                                        setComparisonSliderKey((k) => k + 1)
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
                              Select component types below (wall, floor, ceiling, etc.) and pick a style for each. <strong>No changes appear in the image until you click &quot;Generate room configuration&quot;</strong> below – that button applies all your selections at once.
                            </p>
                            {isDetectingComponents && (
                              <p style={{ fontSize: '0.8rem', color: '#2563eb', marginBottom: '0.5rem' }}>
                                Detecting room components from the image…
                              </p>
                            )}
                            {/* Component type chips – always visible */}
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '0.5rem',
                                marginBottom: '0.75rem',
                              }}
                            >
                              {customizationComponentList.map((type) => (
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
                                  {formatComponentLabel(type)}
                                </button>
                              ))}
                            </div>
                            {selectedElementType && (
                              <>
                                <p style={{ fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                                  <strong>
                                    {formatComponentLabel(selectedElementType)} – pick a look (tap a tile; image from catalog or colour if no photo)
                                  </strong>
                                </p>
                                <CustomizationStyleGrid
                                  variant={
                                    selectedElementType === 'sofa' ||
                                    selectedElementType === 'mattress' ||
                                    selectedElementType === 'bed' ||
                                    selectedElementType === 'carpet' ||
                                    selectedElementType === 'rug'
                                      ? 'large'
                                      : 'compact'
                                  }
                                  options={getOptionsForComponent(selectedElementType, productVariations)}
                                  value={customStyles[selectedElementType] ?? ''}
                                  onChange={(id) => {
                                    setCustomHistory((prev) => [...prev, { ...customStyles }])
                                    if (id) {
                                      setCustomActions((prev) => ({ ...prev, [selectedElementType]: selectedCustomAction }))
                                    }
                                    setCustomStyles((prev) => ({ ...prev, [selectedElementType]: id }))
                                  }}
                                  loading={loadingVariations}
                                  emptyMessage="No styles loaded for this component yet. Supabase options can be added later."
                                />
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
                                    Reset {formatComponentLabel(selectedElementType)}
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
                                        setComparisonSliderKey((k) => k + 1)
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
                            {Object.keys(customStyles).some((k) => customStyles[k] != null) && (
                              <div style={{ marginBottom: '0.75rem', padding: '0.6rem 0.75rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '0.85rem' }}>
                                <strong style={{ color: '#0f766e' }}>Your selections</strong>
                                <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.2rem', color: '#134e4a' }}>
                                  {Object.keys(customStyles).map((type) => {
                                    const id = customStyles[type]
                                    if (id == null) return null
                                    const opts = getOptionsForComponent(type, productVariations)
                                    const label = opts.find((o) => o.id === id)?.label ?? id
                                    return (
                                      <li key={type}>
                                        {formatComponentLabel(type)}: {label}
                                      </li>
                                    )
                                  })}
                                </ul>
                              </div>
                            )}
                            {/* Single button: only this applies customizations to the image */}
                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                              <p className="hint-text" style={{ marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                                Changes in the image happen only when you click the button below.
                              </p>
                              <button
                                type="button"
                                className="button"
                                disabled={isGenerating}
                                style={{
                                  padding: '0.55rem 1.1rem',
                                  background: Object.keys(customStyles).some((k) => customStyles[k] != null) ? '#0d9488' : '#94a3b8',
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
                                    Generating…
                                  </>
                                ) : (
                                  'Generate room configuration'
                                )}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                        </div>
                        {styleReviewGateActive && showStyleReviewPanel && (
                          <aside className="style-review-panel" role="dialog" aria-label="Edit style and color palette">
                            <div
                              className="style-review-panel__header"
                            >
                              <div className="style-review-panel__heading-row">
                                <div
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.04em',
                                    textTransform: 'uppercase',
                                    color: '#64748b',
                                    marginBottom: '0.25rem',
                                  }}
                                >
                                  Step 2 — Adjust look (optional)
                                </div>
                                <button
                                  type="button"
                                  className="button button-secondary style-review-panel__close"
                                  aria-label="Close style and palette panel"
                                  onClick={() => setShowStyleReviewPanel(false)}
                                >
                                  ×
                                </button>
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: '0.6rem',
                                }}
                              >
                                <h3 style={{ fontSize: '0.95rem', margin: 0, color: '#0f172a' }}>Style &amp; color</h3>
                              </div>
                              <p className="hint-text" style={{ marginBottom: '0.75rem', fontSize: '0.8rem', lineHeight: 1.4 }}>
                                Scroll to pick style and palette. Actions stay visible here — no need to scroll down for buttons.
                              </p>
                            </div>
                            <div
                              className="style-review-panel__body"
                              style={{
                                flex: 1,
                                minHeight: 0,
                                overflowY: 'auto',
                                padding: '0.75rem 1rem 1rem',
                                WebkitOverflowScrolling: 'touch',
                              }}
                            >
                              <StyleSelector
                                selectedStyle={selectedStyle}
                                onSelect={setSelectedStyle}
                                variant={configType === 'external' ? 'external' : 'internal'}
                                stepLabel="Style"
                                compact
                              />
                              <ColorPaletteSelector
                                selectedPalette={selectedColorPalette}
                                onSelect={setSelectedColorPalette}
                                variant={configType === 'external' ? 'external' : 'internal'}
                                disabled={isGenerating}
                                compact
                              />
                            </div>
                            <div className="style-review-panel__actions">
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                                <button
                                  type="button"
                                  className="button button-primary"
                                  disabled={isGenerating}
                                  style={{ width: '100%', justifyContent: 'center' }}
                                  onClick={() => void finalizeStyleReviewFromPanel()}
                                >
                                  {isGenerating ? (
                                    <>
                                      <span className="spinner" aria-hidden />
                                      Generating…
                                    </>
                                  ) : (
                                    'Finalize style'
                                  )}
                                </button>
                                <button
                                  type="button"
                                  className="button button-secondary"
                                  style={{ width: '100%', justifyContent: 'center' }}
                                  onClick={() => setShowStyleReviewPanel(false)}
                                >
                                  Close without changes
                                </button>
                              </div>
                            </div>
                          </aside>
                        )}
                  </div>

                  {/* Vastu explanation column (for Vastu-based or Vastu-enabled internal configs) */}
                  {(configType === 'vastu' || (configType === 'internal' && vastuEnabled)) && (
                    <div
                      style={{
                        flex: styleReviewGateActive ? '0 0 auto' : '0 0 260px',
                        maxWidth: styleReviewGateActive ? '100%' : '320px',
                        width: styleReviewGateActive ? '100%' : undefined,
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

                  {generationHistory.length > 0 && showGenerationHistoryPanel && (
                    <div
                      ref={generationHistoryPanelRef}
                      className="card generation-history-panel"
                      style={{
                        flex: styleReviewGateActive ? '0 0 auto' : '0 0 280px',
                        minWidth: '220px',
                        maxWidth: '100%',
                        width: styleReviewGateActive ? '100%' : undefined,
                        alignSelf: styleReviewGateActive ? 'stretch' : undefined,
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
                        {styleReviewGateActive ? (
                          <>
                            {' '}
                            <strong>Note:</strong> switching versions asks you to review style again before customizing.
                          </>
                        ) : null}
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
                        {(() => {
                          const selectedHistoryIdx =
                            generatedImage == null
                              ? -1
                              : generationHistory.findIndex((wm, i) => {
                                  const orig = generationHistoryOriginal[i]
                                  const disp = generatedImage
                                  const co = generatedImageOriginal
                                  if (disp != null && (wm === disp || orig === disp)) return true
                                  if (co != null && (wm === co || orig === co)) return true
                                  return false
                                })
                          return [...generationHistory].reverse().map((url, index) => {
                          const versionNumber = index + 1
                          const originalIndex = generationHistory.length - 1 - index
                          const isCurrent = originalIndex === selectedHistoryIdx
                          return (
                            <button
                              key={`history-${originalIndex}-${url.slice(0, 30)}`}
                              type="button"
                              onClick={() => {
                                setGeneratedImage(url)
                                setComparisonSliderKey((k) => k + 1)
                                if (configType === 'internal' || configType === 'external') {
                                  setStyleFinalizeGatePassed(false)
                                  setShowStyleReviewPanel(false)
                                  setShowDirectEditPanel(false)
                                }
                              }}
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
                        })
                        })()}
                      </div>
                      <button
                        type="button"
                        className="button button-secondary"
                        style={{ marginTop: '0.75rem', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                        onClick={() => {
                          setGenerationHistory([])
                          setGenerationHistoryOriginal([])
                          setShowGenerationHistoryPanel(false)
                        }}
                      >
                        Clear history
                      </button>
                    </div>
                  )}

                </div>
                </>
                )}
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
                    <span><strong>External:</strong> Front elevation, side/back views, compound or open area (min 4).</span>
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

      {(configType === 'internal' || configType === 'external') && hasRoomGenerationResult && (
        <button
          type="button"
          className="button button-secondary"
          data-testid="floating-generate-video-button"
          onClick={handleGenerateTourVideo}
          disabled={isGenerating || styleReviewGateActive}
          title={styleReviewGateActive ? 'Finalize your style first' : 'Generate a 360° room tour video'}
          style={{
            position: 'fixed',
            right: '1.75rem',
            bottom: '1.75rem',
            borderRadius: '999px',
            padding: '0.6rem 1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            boxShadow: '0 10px 25px rgba(15,23,42,0.45)',
            zIndex: 40,
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>🎥</span>
          <span style={{ fontWeight: 600 }}>360° Video</span>
        </button>
      )}
    </div>
  )
}
