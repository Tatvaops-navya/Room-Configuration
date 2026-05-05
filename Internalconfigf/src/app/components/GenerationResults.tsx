import React, { useState, useRef, useLayoutEffect, useCallback, useEffect, useMemo } from 'react';
import {
  postRoomGenerate,
  postCustomizationGenerate,
  postRoomErase,
  postRoomAdd,
  postRoomReplace,
  buildReplaceWithPhrase,
  createMaskFromBoundingBox,
  ensureGenerateImageDataUrl,
  mapEditCategoryToApiElement,
  isCatalogProductStyleKey,
  EXACT_CATALOG_OBJECT_INSTRUCTION,
  paletteDisplayNameToApiId,
  type RoomWizardSession,
  type CustomizationLabelEntry,
} from '../../lib/roomGenerateApi';
import { applyWatermarkToImage, downloadImageWithLogo } from '../../lib/tatvaWatermark';
import RoomImmersiveTourSection from '../../components/RoomImmersiveTourSection';
import { fetchMytylesVitrifiedTiles } from '../../lib/mytylesTilesApi';
import { fetchSofaProductsForEdit } from '../../lib/sofaProductsApi';
import { fetchChairProductsForEdit } from '../../lib/chairProductsApi';
import { fetchTableProductsForEdit } from '../../lib/tableProductsApi';
import { fetchDiningProductsForEdit } from '../../lib/diningProductsApi';
import { fetchCabinetProductsForEdit } from '../../lib/cabinetProductsApi';
import { fetchLightingProductsForEdit } from '../../lib/lightingProductsApi';
import { fetchBedProductsForEdit } from '../../lib/bedProductsApi';
import { fetchMattressProductsForEdit } from '../../lib/mattressProductsApi';
import { fetchCarpetProductsForEdit } from '../../lib/carpetProductsApi';
import {
  fetchDecorProductsForEdit,
  filterDecorCatalogByStylePreset,
  type DecorCatalogItem,
} from '../../lib/decorProductsApi';
import {
  buildObjectCategoriesFromDetection,
  OBJECT_CATEGORY_THUMB_URLS,
  postDetectScene,
} from '../../lib/detectSceneCategories';
import { EDIT_STYLE_SWATCHES_BY_CATEGORY } from './editCustomizationStylePresets';
import { DEFAULT_REGIONAL_STYLE_NAME, REGIONAL_STYLES } from './regionalDesignStyles';
import svgPaths from "../../imports/svg-mvcyhc2fez";

// ── Color palette swatches ─────────────────────────────────────────────────
const COLOR_PALETTES = [
  { name: 'Surprise Me',            gradient: 'linear-gradient(135deg, rgb(232,213,183) 0%, rgb(201,169,110) 50%, rgb(107,76,42) 100%)', dots: ['#e8d5b7','#c9a96e','#6b4c2a'] },
  { name: 'High-Contrast Neutrals', gradient: 'linear-gradient(135deg, rgb(245,245,245) 0%, rgb(26,26,26) 100%)',                        dots: ['#f5f5f5','#888888','#1a1a1a'] },
  { name: 'Forest-Inspired',        gradient: 'linear-gradient(135deg, rgb(45,90,39) 0%, rgb(196,163,90) 100%)',                          dots: ['#2d5a27','#6b8c42','#c4a35a'] },
  { name: 'Ocean Breeze',           gradient: 'linear-gradient(135deg, rgb(184,224,247) 0%, rgb(74,159,200) 100%)',                       dots: ['#b8e0f7','#5a9fc0','#4a9fc8'] },
  { name: 'Sunset Warmth',          gradient: 'linear-gradient(135deg, rgb(247,197,159) 0%, rgb(176,58,46) 100%)',                        dots: ['#f7c59f','#d4724e','#b03a2e'] },
  { name: 'Earth Tones',            gradient: 'linear-gradient(135deg, rgb(226,201,164) 0%, rgb(123,75,42) 100%)',                        dots: ['#e2c9a4','#a68a5b','#7b4b2a'] },
  { name: 'Romance',                gradient: 'linear-gradient(135deg, rgb(249,192,192) 0%, rgb(224,123,138) 100%)',                      dots: ['#f9c0c0','#e89aaa','#e07b8a'] },
  { name: 'Monochrome',             gradient: 'linear-gradient(135deg, rgb(232,232,232) 0%, rgb(42,42,42) 100%)',                         dots: ['#e8e8e8','#808080','#2a2a2a'] },
];

// ── Style previews (aligned with RoomConfigStudio regional styles) ─────────
const STYLE_PALETTES = REGIONAL_STYLES.map((s) => ({
  name: s.name,
  gradient: s.gradient,
  img: s.img,
}));

function stylePreviewUrl(name: string): string | undefined {
  return STYLE_PALETTES.find((s) => s.name === name)?.img;
}

const PLACEHOLDER_ROOM_IMAGE =
  stylePreviewUrl(DEFAULT_REGIONAL_STYLE_NAME) ??
  REGIONAL_STYLES[0]?.img ??
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&q=80';

// ── SVG Icon Components (from Figma svg paths) ─────────────────────────────
function IconRegenerate() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
      <path d={svgPaths.p25182e80} stroke="rgba(255,255,255,0.85)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
      <path d="M1.75 1.75V4.66667H4.66667" stroke="rgba(255,255,255,0.85)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
    </svg>
  );
}

function IconShare() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
      <path d={svgPaths.p275cd40} stroke="rgba(255,255,255,0.85)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
      <path d={svgPaths.p2ff82b00} stroke="rgba(255,255,255,0.85)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
      <path d={svgPaths.p8612e80} stroke="rgba(255,255,255,0.85)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
      <path d={svgPaths.p34971280} stroke="rgba(255,255,255,0.85)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
      <path d={svgPaths.p2b492880} stroke="rgba(255,255,255,0.85)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
    </svg>
  );
}

function IconLike({ active = false }: { active?: boolean }) {
  const heartColor = active ? '#ef4444' : 'rgba(255,255,255,0.85)';
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
      {active && <path d={svgPaths.p168026f2} fill={heartColor} fillOpacity="0.95" />}
      <path d={svgPaths.p168026f2} stroke={heartColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
      <path d={svgPaths.p34aacb00} stroke="rgba(255,255,255,0.85)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
      <path d={svgPaths.p27169580} stroke="rgba(255,255,255,0.85)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
      <path d="M7 8.75V1.75" stroke="rgba(255,255,255,0.85)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
    </svg>
  );
}

function IconWatermark() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2.5 10.5c1.2-2.4 2.8-4.2 4.5-4.2s3.3 1.8 4.5 4.2"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
      <path d="M4 3.5h6M7 3.5v2.5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.15" strokeLinecap="round" />
    </svg>
  );
}

/** Same affordance as room-configuration ResultPreviewToolbar History (☰). */
function IconHistoryMenu() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M2 3.5h10M2 7h10M2 10.5h10" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

type GenerationResultsProps = {
  selectedImageUrl?: string | null;
  roomSession?: RoomWizardSession | null;
  generatedImageUrl?: string | null;
  /** API image before client diagonal watermark; enables hide/show watermark in the UI. */
  generatedImageRawUrl?: string | null;
  onGeneratedImage?: (watermarked: string | null, rawApiUrl?: string | null) => void;
  /** Shown once when landing from wizard after /api/generate returned `warning` */
  serverWarningOnLoad?: string | null;
  /** Wizard: keep “AI analyzing” scan looping until /api/generate finishes */
  externalGeneratePending?: boolean;
  /** Arrangement + empty prefs: hide scan on first wizard gen only; Regenerate still shows scan. */
  externalGenerateScanSuppressed?: boolean;
  /** Wizard API failure after navigating to results */
  externalGenerateError?: string | null;
  imageGenKey?: number;
  onRegenerate?: () => void;
  onFinalize?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onRestart?: () => void;
  isCustomisation?: boolean;
  customActiveTab?: string | null;
  onCustomTabChange?: (tab: string | null) => void;
  /** Newest first — mirrors `generationHistory` in room configuration (`app/page.tsx`). */
  generationHistory?: string[];
  /** Same length/order as `generationHistory` — raw API URL for each version. */
  generationHistoryRaw?: string[];
  /** Call only when the server returns a new image (generate / edit / add / replace / erase). */
  onGenerationHistoryAppend?: (watermarked: string, rawApiUrl: string) => void;
};

function capturePercentRectToEraseRegion(
  panelW: number,
  panelH: number,
  naturalW: number,
  naturalH: number,
  rectPct: { x: number; y: number; w: number; h: number },
  options?: { yAnchorRatio?: number }
) {
  if (!naturalW || !naturalH || !panelW || !panelH) return null;
  const scale = Math.min(panelW / naturalW, panelH / naturalH);
  const renderedW = naturalW * scale;
  const renderedH = naturalH * scale;
  const offsetX = (panelW - renderedW) / 2;
  const freeY = panelH - renderedH;
  const anchor = Math.max(0, Math.min(1, options?.yAnchorRatio ?? 0.5));
  const offsetY = freeY * anchor;
  const left = (rectPct.x / 100) * panelW;
  const top = (rectPct.y / 100) * panelH;
  const pw = (rectPct.w / 100) * panelW;
  const ph = (rectPct.h / 100) * panelH;
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  let x1 = (left - offsetX) / renderedW;
  let y1 = (top - offsetY) / renderedH;
  let x2 = (left + pw - offsetX) / renderedW;
  let y2 = (top + ph - offsetY) / renderedH;
  x1 = clamp(x1, 0, 1);
  y1 = clamp(y1, 0, 1);
  x2 = clamp(x2, 0, 1);
  y2 = clamp(y2, 0, 1);
  const width = x2 - x1;
  const height = y2 - y1;
  if (width < 0.015 || height < 0.015) return null;
  return { x: x1, y: y1, width, height };
}

const STRICT_PROMPT_OBJECT_RULES = [
  'STRICT PROMPT LOCK: Generate ONLY the exact object described by the user prompt.',
  'Do NOT change, reinterpret, or substitute any explicitly mentioned attribute.',
  'Color, material, size, style, and object type must match exactly (example: "pink sofa" must be pink sofa only).',
  'Do NOT apply default styling, auto-enhancement, or alternate color/material choices.',
  'Do NOT add extra objects, decor, companions, or background props.',
  'If prompt is partially unclear, keep all specified attributes unchanged and infer only missing details.',
  'Output must be one realistic component with correct proportions, placed only inside the selected mask area.',
].join(' ');
const MOBILE_IMAGE_Y_ANCHOR = 0.42;

function buildStrictPromptObjectInstruction(userInput: string): string {
  const trimmed = userInput.trim();
  return [
    'Your task is to generate EXACTLY what the user requests — no deviation.',
    '',
    'CRITICAL CONSTRAINTS:',
    '- The object MUST match ALL attributes mentioned:',
    '  • color',
    '  • type',
    '  • material',
    '  • style',
    '- NEVER substitute colors (e.g., pink → green is STRICTLY FORBIDDEN)',
    '- NEVER enhance, stylize, or auto-correct the request',
    '- NEVER choose a "better looking" alternative',
    '',
    'HARD RULE:',
    'If the user says "pink sofa", output MUST be:',
    '- sofa',
    '- pink color ONLY (no green, no beige, no mix)',
    '',
    'NO EXTRA OBJECTS',
    'NO COLOR CHANGES',
    'NO STYLE CHANGES',
    '',
    'OUTPUT:',
    '- Single object only',
    '- Clean background',
    '- Realistic proportions',
    '',
    'SELF-CHECK BEFORE OUTPUT:',
    '1. Is object type correct?',
    '2. Is color EXACT?',
    '3. Any unwanted additions?',
    '',
    'If ANY answer is NO → REGENERATE',
    '',
    `User Prompt: "${trimmed}"`,
  ].join('\n');
}

// ── Main Component ──────────────────────────────────────────────────────────
export function GenerationResults({
  selectedImageUrl,
  roomSession = null,
  generatedImageUrl = null,
  generatedImageRawUrl = null,
  onGeneratedImage,
  serverWarningOnLoad = null,
  externalGeneratePending = false,
  externalGenerateScanSuppressed = false,
  externalGenerateError = null,
  imageGenKey = 0,
  onRegenerate,
  onFinalize,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onRestart,
  isCustomisation = false,
  customActiveTab,
  onCustomTabChange,
  generationHistory = [],
  generationHistoryRaw = [],
  onGenerationHistoryAppend,
}: GenerationResultsProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [mobileRightPanelOpen, setMobileRightPanelOpen] = useState(false);
  const [activeTab,        setActiveTab]        = useState<'color' | 'style'>('color');
  const [selectedPalette,  setSelectedPalette]  = useState<string | null>(null);
  const [selectedStyle,    setSelectedStyle]    = useState<string>('Modern');
  const [strictLayoutLockEnabled, setStrictLayoutLockEnabled] = useState(true);
  const [selectedColorDots, setSelectedColorDots] = useState<string[] | null>(null);
  const [customPanelTab, setCustomPanelTab] = useState<'Style' | 'Colour' | 'Material'>('Style');
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [selectedMaterialImageUrl, setSelectedMaterialImageUrl] = useState<string | null>(null);
  const [selectedStyleSwatch, setSelectedStyleSwatch] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<(string | null)[]>([null, null, null]);
  const [confirmedUploadImages, setConfirmedUploadImages] = useState<string[]>([]);
  const [leftPanelTab, setLeftPanelTab] = useState<'Object Categories' | 'Action' | 'History'>('Object Categories');
  /** When not in edit/customisation mode, history rail matches room-configuration: hidden until user opens it. */
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  useEffect(() => {
    if (generationHistory.length === 0) setShowHistoryPanel(false);
  }, [generationHistory.length]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setMobileHistoryOpen(false);
      setMobileRightPanelOpen(false);
      return;
    }
    // Preserve existing behavior: open history only when explicitly requested.
    setMobileHistoryOpen(false);
    // Keep right panel closed by default on mobile so preview is visible first.
    setMobileRightPanelOpen(false);
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile || !isCustomisation) return;
    const isDirectCaptureTab =
      customActiveTab === 'Add Object' || customActiveTab === 'Replace' || customActiveTab === 'Erase';
    // Mobile direct-capture flow: keep the left panel closed.
    if (isDirectCaptureTab) {
      setMobileHistoryOpen(false);
      return;
    }
    setMobileHistoryOpen(customActiveTab !== null);
  }, [isMobile, isCustomisation, customActiveTab]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  /** Add Object: same category list as Edit; drives catalog / tiles / presets in the right panel. */
  const [addSelectedCategory, setAddSelectedCategory] = useState<string | null>(null);
  const [addPanelTab, setAddPanelTab] = useState<'Style' | 'Colour' | 'Material'>('Style');
  const [addSelectedStyleSwatch, setAddSelectedStyleSwatch] = useState<string | null>(null);
  const [addSelectedMaterial, setAddSelectedMaterial] = useState<string | null>(null);
  const [addSelectedMaterialImageUrl, setAddSelectedMaterialImageUrl] = useState<string | null>(null);
  const [addSelectedColorDots, setAddSelectedColorDots] = useState<string[] | null>(null);

  useEffect(() => {
    setSelectedStyleSwatch(null);
    setSelectedMaterial(null);
    setSelectedMaterialImageUrl(null);
    setSelectedColorDots(null);
  }, [selectedCategory]);

  useEffect(() => {
    setAddSelectedStyleSwatch(null);
    setAddSelectedMaterial(null);
    setAddSelectedMaterialImageUrl(null);
    setAddSelectedColorDots(null);
  }, [addSelectedCategory]);

  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [addObjectSubPanel, setAddObjectSubPanel] = useState<'uploadedComponent' | 'generatePrompt' | null>(null);
  const [generatePromptText, setGeneratePromptText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState(false);
  const [generateScanning, setGenerateScanning] = useState(false);
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState<string | null>(null);
  const generateTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [customisationConfirmed, setCustomisationConfirmed] = useState(false);
  const [uploadedImgIdx, setUploadedImgIdx] = useState(0);
  const [uploadedCompColour, setUploadedCompColour] = useState<string | null>(null);

  // ── Replace tab state (category-driven catalog + upload / prompt, mirrors Add Object) ──
  const [replaceSubPanel, setReplaceSubPanel] = useState<'uploadedComponent' | 'generatePrompt' | null>(null);
  const [replaceSelectedCategory, setReplaceSelectedCategory] = useState<string | null>(null);
  const [replacePanelTab, setReplacePanelTab] = useState<'Style' | 'Colour' | 'Material'>('Style');
  const [replaceSelectedStyleSwatch, setReplaceSelectedStyleSwatch] = useState<string | null>(null);
  const [replaceSelectedMaterial, setReplaceSelectedMaterial] = useState<string | null>(null);
  const [replaceSelectedMaterialImageUrl, setReplaceSelectedMaterialImageUrl] = useState<string | null>(null);
  const [replaceSelectedColorDots, setReplaceSelectedColorDots] = useState<string[] | null>(null);
  const [repPromptText, setRepPromptText] = useState('');
  const [repGenerating, setRepGenerating] = useState(false);
  const [repGeneratedPreview, setRepGeneratedPreview] = useState(false);
  const [repGenerateScanning, setRepGenerateScanning] = useState(false);
  const repGenerateTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [repUploadedImages, setRepUploadedImages] = useState<(string | null)[]>([null, null, null]);
  const [repConfirmedUploadImages, setRepConfirmedUploadImages] = useState<string[]>([]);
  const [repShowUploadModal, setRepShowUploadModal] = useState(false);
  const [repUploadedImgIdx, setRepUploadedImgIdx] = useState(0);
  const [repUploadedCompColour, setRepUploadedCompColour] = useState<string | null>(null);

  useEffect(() => {
    setReplaceSelectedStyleSwatch(null);
    setReplaceSelectedMaterial(null);
    setReplaceSelectedMaterialImageUrl(null);
    setReplaceSelectedColorDots(null);
  }, [replaceSelectedCategory]);

  // ── Erase tab state ──
  const [eraseLeftTab, setEraseLeftTab] = useState<'Objects' | 'History'>('Objects');

  /** AI scene parse from current result image → drives Object Categories order (bedroom → Bed, etc.). */
  const [sceneRoomType, setSceneRoomType] = useState<string | null>(null);
  const [sceneComponents, setSceneComponents] = useState<string[]>([]);
  const [sceneDetectLoading, setSceneDetectLoading] = useState(false);

  // Edit → Wall/Floor: Mytyles vitrified tiles from Supabase (via Next API)
  const [editMytylesTiles, setEditMytylesTiles] = useState<{ id: number; label: string; imageUrl: string }[]>([]);
  const [editMytylesLoading, setEditMytylesLoading] = useState(false);
  const [editMytylesError, setEditMytylesError] = useState<string | null>(null);

  const [editSofaProducts, setEditSofaProducts] = useState<{ id: string; label: string; imageUrl: string }[]>([]);
  const [editChairProducts, setEditChairProducts] = useState<{ id: string; label: string; imageUrl: string }[]>([]);
  const [editLightingProducts, setEditLightingProducts] = useState<{ id: string; label: string; imageUrl: string }[]>([]);
  const [editTableProducts, setEditTableProducts] = useState<{ id: string; label: string; imageUrl: string }[]>([]);
  const [editDiningProducts, setEditDiningProducts] = useState<{ id: string; label: string; imageUrl: string }[]>([]);
  const [editLightingLoading, setEditLightingLoading] = useState(false);
  const [editLightingError, setEditLightingError] = useState<string | null>(null);
  const [editSofaLoading, setEditSofaLoading] = useState(false);
  const [editSofaError, setEditSofaError] = useState<string | null>(null);
  const [editChairLoading, setEditChairLoading] = useState(false);
  const [editChairError, setEditChairError] = useState<string | null>(null);
  const [editTableLoading, setEditTableLoading] = useState(false);
  const [editTableError, setEditTableError] = useState<string | null>(null);
  const [editDiningLoading, setEditDiningLoading] = useState(false);
  const [editDiningError, setEditDiningError] = useState<string | null>(null);
  const [editCabinetProducts, setEditCabinetProducts] = useState<{ id: string; label: string; imageUrl: string }[]>(
    []
  );
  const [editCabinetLoading, setEditCabinetLoading] = useState(false);
  const [editCabinetError, setEditCabinetError] = useState<string | null>(null);
  const [editBedProducts, setEditBedProducts] = useState<{ id: string; label: string; imageUrl: string }[]>([]);
  const [editMattressProducts, setEditMattressProducts] = useState<{ id: string; label: string; imageUrl: string }[]>([]);
  const [editBedLoading, setEditBedLoading] = useState(false);
  const [editBedError, setEditBedError] = useState<string | null>(null);
  const [editMattressLoading, setEditMattressLoading] = useState(false);
  const [editMattressError, setEditMattressError] = useState<string | null>(null);
  const [editCarpetProducts, setEditCarpetProducts] = useState<{ id: string; label: string; imageUrl: string }[]>([]);
  const [editCarpetLoading, setEditCarpetLoading] = useState(false);
  const [editCarpetError, setEditCarpetError] = useState<string | null>(null);
  const [editDecorProducts, setEditDecorProducts] = useState<DecorCatalogItem[]>([]);
  const [editDecorLoading, setEditDecorLoading] = useState(false);
  const [editDecorError, setEditDecorError] = useState<string | null>(null);

  // Capture area selection state
  const [captureMode, setCaptureMode] = useState(false);
  const [captureDrawing, setCaptureDrawing] = useState(false);
  const [captureRect, setCaptureRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [captureLocked, setCaptureLocked] = useState(false);
  const [captureStart, setCaptureStart] = useState<{ x: number; y: number } | null>(null);
  const [captureDragMode, setCaptureDragMode] = useState<'none' | 'move' | 'nw' | 'ne' | 'sw' | 'se'>('none');
  const [captureDragOrigin, setCaptureDragOrigin] = useState<{ mx: number; my: number; rect: { x: number; y: number; w: number; h: number } } | null>(null);
  const [captureThumb, setCaptureThumb] = useState<string | null>(null);
  const [capturePixelDims, setCapturePixelDims] = useState<{ w: number; h: number } | null>(null);
  const [showSelectedAreaEffect, setShowSelectedAreaEffect] = useState(false);
  useEffect(() => {
    // Keep initial selection clear; show effect only after action buttons are pressed.
    if (selectedAction !== 'capture' || !captureLocked) {
      setShowSelectedAreaEffect(false);
    }
  }, [selectedAction, captureLocked]);

  // Reset left panel tab when floating tab changes
  useEffect(() => {
    if (customActiveTab === 'Edit') {
      setLeftPanelTab('Object Categories');
      if (isMobile) {
        // Mobile Edit flow starts from the left object list.
        setMobileHistoryOpen(true);
        setMobileRightPanelOpen(false);
      }
      setSelectedAction(null);
      setAddSelectedCategory(null);
      setAddObjectSubPanel(null);
      setReplaceSelectedCategory(null);
      setReplacePanelTab('Style');
      setReplaceSubPanel(null);
      setReplaceSelectedStyleSwatch(null);
      setReplaceSelectedMaterial(null);
      setReplaceSelectedMaterialImageUrl(null);
      setReplaceSelectedColorDots(null);
    } else if (customActiveTab === 'Add Object') {
      setLeftPanelTab('Object Categories');
      setSelectedCategory(null);
      setSelectedAction(isMobile ? 'capture' : null);
      setAddSelectedCategory(null);
      setAddPanelTab('Style');
      setAddObjectSubPanel(null);
      setReplaceSelectedCategory(null);
      setReplacePanelTab('Style');
      setReplaceSubPanel(null);
      setReplaceSelectedStyleSwatch(null);
      setReplaceSelectedMaterial(null);
      setReplaceSelectedMaterialImageUrl(null);
      setReplaceSelectedColorDots(null);
    } else if (customActiveTab === 'Replace') {
      setLeftPanelTab('Object Categories');
      setSelectedCategory(null);
      setSelectedAction(isMobile ? 'capture' : null);
      setAddSelectedCategory(null);
      setAddObjectSubPanel(null);
      setReplaceSelectedCategory(null);
      setReplacePanelTab('Style');
      setReplaceSubPanel(null);
      setReplaceSelectedStyleSwatch(null);
      setReplaceSelectedMaterial(null);
      setReplaceSelectedMaterialImageUrl(null);
      setReplaceSelectedColorDots(null);
    } else if (customActiveTab === 'Erase') {
      setLeftPanelTab('Action');
      setSelectedCategory(null);
      setSelectedAction(isMobile ? 'capture' : null);
      setAddObjectSubPanel(null);
      setReplaceSubPanel(null);
      setReplaceSelectedCategory(null);
      setReplacePanelTab('Style');
      setReplaceSelectedStyleSwatch(null);
      setReplaceSelectedMaterial(null);
      setReplaceSelectedMaterialImageUrl(null);
      setReplaceSelectedColorDots(null);
    } else if (customActiveTab) {
      setLeftPanelTab('Action');
      setSelectedCategory(null);
      setSelectedAction(null);
      setAddObjectSubPanel(null);
      setReplaceSubPanel(null);
      setReplaceSelectedCategory(null);
      setReplacePanelTab('Style');
      setReplaceSelectedStyleSwatch(null);
      setReplaceSelectedMaterial(null);
      setReplaceSelectedMaterialImageUrl(null);
      setReplaceSelectedColorDots(null);
    } else {
      setSelectedCategory(null);
      setSelectedAction(null);
    }
  }, [customActiveTab, isMobile]);

  /** Keep the same catalog fetch + swatch rows while user switches Style / Colour / Material (tabs must not clear bed/sofa loads). */
  const styleCategoryForCatalog =
    customActiveTab === 'Edit'
      ? selectedCategory
      : customActiveTab === 'Add Object'
        ? addSelectedCategory
        : customActiveTab === 'Replace'
          ? replaceSelectedCategory
          : null;
  const normalizeCategoryKey = (value: string | null): string | null => {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    const lower = trimmed.toLowerCase();
    if (lower === 'dinning' || lower === 'dining') return 'Dining';
    return trimmed;
  };

  useEffect(() => {
    const needTiles =
      isCustomisation &&
      styleCategoryForCatalog != null &&
      (styleCategoryForCatalog === 'Wall' || styleCategoryForCatalog === 'Floor');
    if (!needTiles) {
      setEditMytylesTiles([]);
      setEditMytylesError(null);
      setEditMytylesLoading(false);
      return;
    }
    let cancelled = false;
    setEditMytylesLoading(true);
    setEditMytylesError(null);
    void fetchMytylesVitrifiedTiles().then(({ items, error }) => {
      if (cancelled) return;
      setEditMytylesLoading(false);
      setEditMytylesTiles(items);
      if (error) setEditMytylesError(error);
      else setEditMytylesError(null);
    });
    return () => {
      cancelled = true;
    };
  }, [isCustomisation, styleCategoryForCatalog]);

  useEffect(() => {
    const needSofas = isCustomisation && styleCategoryForCatalog === 'Sofa';
    if (!needSofas) {
      setEditSofaProducts([]);
      setEditSofaError(null);
      setEditSofaLoading(false);
      return;
    }
    let cancelled = false;
    setEditSofaLoading(true);
    setEditSofaError(null);
    void fetchSofaProductsForEdit().then(({ items, error }) => {
      if (cancelled) return;
      setEditSofaLoading(false);
      setEditSofaProducts(items);
      if (error) setEditSofaError(error);
      else setEditSofaError(null);
    });
    return () => {
      cancelled = true;
    };
  }, [isCustomisation, styleCategoryForCatalog]);

  useEffect(() => {
    const needChairs = isCustomisation && styleCategoryForCatalog === 'Chair';
    if (!needChairs) {
      setEditChairProducts([]);
      setEditChairError(null);
      setEditChairLoading(false);
      return;
    }
    let cancelled = false;
    setEditChairLoading(true);
    setEditChairError(null);
    void fetchChairProductsForEdit().then(({ items, error }) => {
      if (cancelled) return;
      setEditChairLoading(false);
      setEditChairProducts(items);
      if (error) setEditChairError(error);
      else setEditChairError(null);
    });
    return () => {
      cancelled = true;
    };
  }, [isCustomisation, styleCategoryForCatalog]);

  useEffect(() => {
    const needTables = isCustomisation && styleCategoryForCatalog === 'Table';
    if (!needTables) {
      setEditTableProducts([]);
      setEditTableError(null);
      setEditTableLoading(false);
      return;
    }
    let cancelled = false;
    setEditTableLoading(true);
    setEditTableError(null);
    void fetchTableProductsForEdit().then(({ items, error }) => {
      if (cancelled) return;
      setEditTableLoading(false);
      setEditTableProducts(items);
      if (error) setEditTableError(error);
      else setEditTableError(null);
    });
    return () => {
      cancelled = true;
    };
  }, [isCustomisation, styleCategoryForCatalog]);

  useEffect(() => {
    const needDining = isCustomisation && normalizeCategoryKey(styleCategoryForCatalog) === 'Dining';
    if (!needDining) {
      setEditDiningProducts([]);
      setEditDiningError(null);
      setEditDiningLoading(false);
      return;
    }
    let cancelled = false;
    setEditDiningLoading(true);
    setEditDiningError(null);
    void fetchDiningProductsForEdit().then(({ items, error }) => {
      if (cancelled) return;
      setEditDiningLoading(false);
      setEditDiningProducts(items);
      if (error) setEditDiningError(error);
      else setEditDiningError(null);
    });
    return () => {
      cancelled = true;
    };
  }, [isCustomisation, styleCategoryForCatalog]);

  useEffect(() => {
    const needCabinets = isCustomisation && styleCategoryForCatalog === 'Cabinet';
    if (!needCabinets) {
      setEditCabinetProducts([]);
      setEditCabinetError(null);
      setEditCabinetLoading(false);
      return;
    }
    let cancelled = false;
    setEditCabinetLoading(true);
    setEditCabinetError(null);
    void fetchCabinetProductsForEdit().then(({ items, error }) => {
      if (cancelled) return;
      setEditCabinetLoading(false);
      setEditCabinetProducts(items);
      if (error) setEditCabinetError(error);
      else setEditCabinetError(null);
    });
    return () => {
      cancelled = true;
    };
  }, [isCustomisation, styleCategoryForCatalog]);

  useEffect(() => {
    const needBeds = isCustomisation && styleCategoryForCatalog === 'Bed';
    if (!needBeds) {
      setEditBedProducts([]);
      setEditBedError(null);
      setEditBedLoading(false);
      return;
    }
    let cancelled = false;
    setEditBedLoading(true);
    setEditBedError(null);
    void fetchBedProductsForEdit().then(({ items, error }) => {
      if (cancelled) return;
      setEditBedLoading(false);
      setEditBedProducts(items);
      if (error) setEditBedError(error);
      else setEditBedError(null);
    });
    return () => {
      cancelled = true;
    };
  }, [isCustomisation, styleCategoryForCatalog]);

  useEffect(() => {
    const needMattresses = isCustomisation && styleCategoryForCatalog === 'Mattress';
    if (!needMattresses) {
      setEditMattressProducts([]);
      setEditMattressError(null);
      setEditMattressLoading(false);
      return;
    }
    let cancelled = false;
    setEditMattressLoading(true);
    setEditMattressError(null);
    void fetchMattressProductsForEdit().then(({ items, error }) => {
      if (cancelled) return;
      setEditMattressLoading(false);
      setEditMattressProducts(items);
      if (error) setEditMattressError(error);
      else setEditMattressError(null);
    });
    return () => {
      cancelled = true;
    };
  }, [isCustomisation, styleCategoryForCatalog]);

  useEffect(() => {
    const needCarpets = isCustomisation && styleCategoryForCatalog === 'Carpet';
    if (!needCarpets) {
      setEditCarpetProducts([]);
      setEditCarpetError(null);
      setEditCarpetLoading(false);
      return;
    }
    let cancelled = false;
    setEditCarpetLoading(true);
    setEditCarpetError(null);
    void fetchCarpetProductsForEdit().then(({ items, error }) => {
      if (cancelled) return;
      setEditCarpetLoading(false);
      setEditCarpetProducts(items);
      if (error) setEditCarpetError(error);
      else setEditCarpetError(null);
    });
    return () => {
      cancelled = true;
    };
  }, [isCustomisation, styleCategoryForCatalog]);

  useEffect(() => {
    const needLighting = isCustomisation && styleCategoryForCatalog === 'Lighting';
    if (!needLighting) {
      setEditLightingProducts([]);
      setEditLightingError(null);
      setEditLightingLoading(false);
      return;
    }
    let cancelled = false;
    setEditLightingLoading(true);
    setEditLightingError(null);
    void fetchLightingProductsForEdit().then(({ items, error }) => {
      if (cancelled) return;
      setEditLightingLoading(false);
      setEditLightingProducts(items);
      if (error) setEditLightingError(error);
      else setEditLightingError(null);
    });
    return () => {
      cancelled = true;
    };
  }, [isCustomisation, styleCategoryForCatalog]);

  useEffect(() => {
    const needDecor = isCustomisation && styleCategoryForCatalog === 'Decor';
    if (!needDecor) {
      setEditDecorProducts([]);
      setEditDecorError(null);
      setEditDecorLoading(false);
      return;
    }
    let cancelled = false;
    setEditDecorLoading(true);
    setEditDecorError(null);
    void fetchDecorProductsForEdit().then(({ items, error }) => {
      if (cancelled) return;
      setEditDecorLoading(false);
      setEditDecorProducts(items);
      if (error) setEditDecorError(error);
      else setEditDecorError(null);
    });
    return () => {
      cancelled = true;
    };
  }, [isCustomisation, styleCategoryForCatalog]);

  const catalogStyleSwatchRows = useMemo(() => {
    const catRaw =
      customActiveTab === 'Edit'
        ? selectedCategory
        : customActiveTab === 'Add Object'
          ? addSelectedCategory
          : customActiveTab === 'Replace'
            ? replaceSelectedCategory
            : null;
    const cat = normalizeCategoryKey(catRaw);
    if (!cat) return [] as { img: string; n: string; k: string; title: string }[];
    const fallback = EDIT_STYLE_SWATCHES_BY_CATEGORY[cat] ?? [];
    const useTileCatalog =
      isCustomisation &&
      (customActiveTab === 'Edit' || customActiveTab === 'Add Object' || customActiveTab === 'Replace') &&
      (cat === 'Wall' || cat === 'Floor');
    const useSofaCatalog =
      isCustomisation &&
      (customActiveTab === 'Edit' || customActiveTab === 'Add Object' || customActiveTab === 'Replace') &&
      (cat === 'Sofa' || cat === 'Chair' || cat === 'Bed' || cat === 'Mattress' || cat === 'Carpet');
    const useLightingCatalog =
      isCustomisation &&
      (customActiveTab === 'Edit' || customActiveTab === 'Add Object' || customActiveTab === 'Replace') &&
      cat === 'Lighting';
    const useTableCatalog =
      isCustomisation &&
      (customActiveTab === 'Edit' || customActiveTab === 'Add Object' || customActiveTab === 'Replace') &&
      cat === 'Table';
    const useDiningCatalog =
      isCustomisation &&
      (customActiveTab === 'Edit' || customActiveTab === 'Add Object' || customActiveTab === 'Replace') &&
      cat === 'Dining';
    const useCabinetCatalog =
      isCustomisation &&
      (customActiveTab === 'Edit' || customActiveTab === 'Add Object' || customActiveTab === 'Replace') &&
      cat === 'Cabinet';
    const useDecorCatalog =
      isCustomisation &&
      (customActiveTab === 'Edit' || customActiveTab === 'Add Object' || customActiveTab === 'Replace') &&
      cat === 'Decor';
    if (useTileCatalog && editMytylesLoading) {
      return [] as { img: string; n: string; k: string; title: string }[];
    }
    if (
      useSofaCatalog &&
      (editSofaLoading ||
        editChairLoading ||
        editBedLoading ||
        editMattressLoading ||
        editCarpetLoading)
    ) {
      return [] as { img: string; n: string; k: string; title: string }[];
    }
    if (useLightingCatalog && editLightingLoading) {
      return [] as { img: string; n: string; k: string; title: string }[];
    }
    if (useTableCatalog && editTableLoading) {
      return [] as { img: string; n: string; k: string; title: string }[];
    }
    if (useDiningCatalog && editDiningLoading) {
      return [] as { img: string; n: string; k: string; title: string }[];
    }
    if (useCabinetCatalog && editCabinetLoading) {
      return [] as { img: string; n: string; k: string; title: string }[];
    }
    if (useDecorCatalog && editDecorLoading) {
      return [] as { img: string; n: string; k: string; title: string }[];
    }
    if (useTileCatalog && editMytylesTiles.length > 0) {
      return editMytylesTiles.map((t) => {
        const full = t.label;
        const n = full.length > 52 ? `${full.slice(0, 51)}…` : full;
        return { img: t.imageUrl, n, k: `mytyles-${t.id}`, title: full };
      });
    }
    if (useSofaCatalog && cat === 'Sofa' && editSofaProducts.length > 0) {
      return editSofaProducts.map((t) => {
        const full = t.label;
        const n = full.length > 52 ? `${full.slice(0, 51)}…` : full;
        return { img: t.imageUrl, n, k: t.id, title: full };
      });
    }
    if (useSofaCatalog && cat === 'Chair' && editChairProducts.length > 0) {
      return editChairProducts.map((t) => {
        const full = t.label;
        const n = full.length > 52 ? `${full.slice(0, 51)}…` : full;
        return { img: t.imageUrl, n, k: t.id, title: full };
      });
    }
    if (useSofaCatalog && cat === 'Bed' && editBedProducts.length > 0) {
      return editBedProducts.map((t) => {
        const full = t.label;
        const n = full.length > 52 ? `${full.slice(0, 51)}…` : full;
        return { img: t.imageUrl, n, k: t.id, title: full };
      });
    }
    if (useSofaCatalog && cat === 'Mattress' && editMattressProducts.length > 0) {
      return editMattressProducts.map((t) => {
        const full = t.label;
        const n = full.length > 52 ? `${full.slice(0, 51)}…` : full;
        return { img: t.imageUrl, n, k: t.id, title: full };
      });
    }
    if (useSofaCatalog && cat === 'Carpet' && editCarpetProducts.length > 0) {
      return editCarpetProducts.map((t) => {
        const full = t.label;
        const n = full.length > 52 ? `${full.slice(0, 51)}…` : full;
        return { img: t.imageUrl, n, k: t.id, title: full };
      });
    }
    if (useLightingCatalog && editLightingProducts.length > 0) {
      return editLightingProducts.map((t) => {
        const full = t.label;
        const n = full.length > 52 ? `${full.slice(0, 51)}…` : full;
        return { img: t.imageUrl, n, k: t.id, title: full };
      });
    }
    if (useTableCatalog && editTableProducts.length > 0) {
      return editTableProducts.map((t) => {
        const full = t.label;
        const n = full.length > 52 ? `${full.slice(0, 51)}…` : full;
        return { img: t.imageUrl, n, k: t.id, title: full };
      });
    }
    if (useDiningCatalog && editDiningProducts.length > 0) {
      return editDiningProducts.map((t) => {
        const full = t.label;
        const n = full.length > 52 ? `${full.slice(0, 51)}…` : full;
        return { img: t.imageUrl, n, k: t.id, title: full };
      });
    }
    if (useCabinetCatalog && editCabinetProducts.length > 0) {
      return editCabinetProducts.map((t) => {
        const full = t.label;
        const n = full.length > 52 ? `${full.slice(0, 51)}…` : full;
        return { img: t.imageUrl, n, k: t.id, title: full };
      });
    }
    if (useDecorCatalog && editDecorProducts.length > 0) {
      const decorPresets = EDIT_STYLE_SWATCHES_BY_CATEGORY.Decor ?? [];
      const presetNameSet = new Set(decorPresets.map((s) => s.n));
      const stylePick =
        customActiveTab === 'Edit'
          ? selectedStyleSwatch
          : customActiveTab === 'Add Object'
            ? addSelectedStyleSwatch
            : replaceSelectedStyleSwatch;
      const isPreset = Boolean(stylePick && presetNameSet.has(stylePick));
      const isProduct = Boolean(stylePick && /^decor_\d+$/i.test(stylePick));
      if (!isPreset && !isProduct) {
        return decorPresets.map((sw) => ({ img: sw.img, n: sw.n, k: sw.n, title: sw.n }));
      }
      const source =
        isPreset && stylePick
          ? filterDecorCatalogByStylePreset(editDecorProducts, stylePick)
          : editDecorProducts;
      return source.map((t) => {
        const full = t.label;
        const n = full.length > 52 ? `${full.slice(0, 51)}…` : full;
        return { img: t.imageUrl, n, k: t.id, title: full };
      });
    }
    return fallback.map((sw) => ({ img: sw.img, n: sw.n, k: sw.n, title: sw.n }));
  }, [
    selectedCategory,
    addSelectedCategory,
    replaceSelectedCategory,
    customActiveTab,
    isCustomisation,
    editMytylesLoading,
    editMytylesTiles,
    editSofaLoading,
    editSofaProducts,
    editChairLoading,
    editChairProducts,
    editBedLoading,
    editBedProducts,
    editMattressLoading,
    editMattressProducts,
    editCarpetLoading,
    editCarpetProducts,
    editLightingLoading,
    editLightingProducts,
    editTableLoading,
    editTableProducts,
    editDiningLoading,
    editDiningProducts,
    editCabinetLoading,
    editCabinetProducts,
    editDecorLoading,
    editDecorProducts,
    selectedStyleSwatch,
    addSelectedStyleSwatch,
    replaceSelectedStyleSwatch,
  ]);

  // Sync capture mode with selectedAction
  useEffect(() => {
    const active = isCustomisation && (customActiveTab === 'Add Object' || customActiveTab === 'Replace' || customActiveTab === 'Erase') && selectedAction === 'capture';
    setCaptureMode(active);
    if (!active) {
      setCaptureRect(null);
      setCaptureLocked(false);
      setCaptureDrawing(false);
      setCaptureStart(null);
      setCaptureDragMode('none');
      setCaptureDragOrigin(null);
      setCaptureThumb(null);
      setCapturePixelDims(null);
    }
  }, [selectedAction, customActiveTab, isCustomisation]);

  // Escape key cancels capture
  useEffect(() => {
    if (!captureMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedAction(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [captureMode]);

  const [showCompare, setShowCompare] = useState(false);
  /** When set, BEFORE slider uses this (previous step) instead of the original layout — for regen-from-current and customisation APIs. */
  const [compareBeforeOverride, setCompareBeforeOverride] = useState<string | null>(null);
  const [dividerPos, setDividerPos] = useState(0);
  const [labelsOpacity, setLabelsOpacity] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragRafRef = useRef<number | null>(null);
  const pendingDividerPosRef = useRef<number | null>(null);
  const [placingComponent, setPlacingComponent] = useState(false);
  const [placingPhase, setPlacingPhase] = useState<'idle' | 'animating' | 'fadeout'>('idle');
  const placingStartRef = useRef<number>(0);
  const placingRafRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagePanelRef = useRef<HTMLDivElement>(null);
  const afterImageRef = useRef<HTMLImageElement>(null);
  const [renderedImageOffset, setRenderedImageOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [renderedImageSize, setRenderedImageSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const [apiGenerating, setApiGenerating] = useState(false);
  const [apiGenerateKind, setApiGenerateKind] = useState<'regen' | 'finalize' | 'customize' | 'erase' | 'add' | 'replace' | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiWarning, setApiWarning] = useState<string | null>(null);
  const [mobileFinalizeDismissed, setMobileFinalizeDismissed] = useState(false);

  useEffect(() => {
    const w = serverWarningOnLoad?.trim();
    if (w) setApiWarning(w);
  }, [serverWarningOnLoad]);

  useEffect(() => {
    if (externalGenerateError?.trim()) {
      setApiError(externalGenerateError.trim());
    }
  }, [externalGenerateError]);

  const roomImageBusy = !!(externalGeneratePending || apiGenerating);
  const isCustomComponentConfiguration = roomSession?.configMode === 'arrangement';
  /** Custom components (arrangement): Finalize works without sidebar style/color and while wizard gen runs. */
  const finalizeDisabled =
    !roomSession ||
    apiGenerating ||
    (externalGeneratePending && roomSession.configMode !== 'arrangement');
  /** Scan canvas only; compare slider still waits on `roomImageBusy`. */
  const showScanCanvas =
    roomImageBusy &&
    !(externalGeneratePending && externalGenerateScanSuppressed && !apiGenerating);
  const roomBusyRef = useRef(roomImageBusy);
  roomBusyRef.current = roomImageBusy;
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const prevIsCustomisationRef = useRef(isCustomisation);
  useEffect(() => {
    if (isCustomisation && !prevIsCustomisationRef.current) {
      setShowCompare(false);
      setDividerPos(0);
      setLabelsOpacity(0);
      setCustomisationConfirmed(false);
      setCompareBeforeOverride(null);
    }
    prevIsCustomisationRef.current = isCustomisation;
  }, [isCustomisation]);

  useEffect(() => {
    if (!roomSession) return;
    setSelectedStyle(roomSession.style || DEFAULT_REGIONAL_STYLE_NAME);
    const p = roomSession.paletteName;
    setSelectedPalette(p);
    if (p) {
      const dots = COLOR_PALETTES.find((c) => c.name === p)?.dots;
      if (dots) setSelectedColorDots(dots);
    }
  }, [roomSession]);

  const apiResultImageUrl = useMemo(() => {
    const r = generatedImageRawUrl?.trim();
    if (r) return r;
    return generatedImageUrl?.trim() ?? '';
  }, [generatedImageRawUrl, generatedImageUrl]);

  const measureRenderedImageOffset = useCallback(() => {
    const panel = imagePanelRef.current;
    const img = afterImageRef.current;
    if (!panel || !img?.naturalWidth || !img.naturalHeight) {
      setRenderedImageOffset({ x: 0, y: 0 });
      setRenderedImageSize({ w: 0, h: 0 });
      return;
    }
    const panelW = panel.clientWidth;
    const panelH = panel.clientHeight;
    if (!panelW || !panelH) {
      setRenderedImageOffset({ x: 0, y: 0 });
      setRenderedImageSize({ w: 0, h: 0 });
      return;
    }
    const scale = Math.min(panelW / img.naturalWidth, panelH / img.naturalHeight);
    const renderedW = img.naturalWidth * scale;
    const renderedH = img.naturalHeight * scale;
    const offsetX = Math.max(0, (panelW - renderedW) / 2);
    const freeY = Math.max(0, panelH - renderedH);
    const offsetY = isMobile ? freeY * MOBILE_IMAGE_Y_ANCHOR : freeY * 0.5;
    setRenderedImageOffset({ x: offsetX, y: offsetY });
    setRenderedImageSize({ w: renderedW, h: renderedH });
  }, [isMobile]);

  useEffect(() => {
    measureRenderedImageOffset();
    const panel = imagePanelRef.current;
    if (!panel) return;
    const observer = new ResizeObserver(() => {
      measureRenderedImageOffset();
    });
    observer.observe(panel);
    window.addEventListener('resize', measureRenderedImageOffset);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measureRenderedImageOffset);
    };
  }, [measureRenderedImageOffset, generatedImageUrl, generatedImageRawUrl, showCompare]);

  const runGenerate = useCallback(
    async (
      opts?: { shuffle?: boolean; useCurrentResult?: boolean; silent?: boolean },
      kind?: 'regen' | 'finalize'
    ) => {
      if (!roomSession) {
        const msg =
          'Finish the room wizard first. With Vite dev, run the Next app on port 3000 so /api/generate is available.';
        if (!opts?.silent && mountedRef.current) setApiError(msg);
        return false;
      }
      const silent = !!opts?.silent;
      const useCur = !!(opts?.useCurrentResult && generatedImageUrl?.trim());
      if (!silent) {
        if (useCur && generatedImageUrl?.trim()) {
          setCompareBeforeOverride(generatedImageUrl.trim());
        } else {
          setCompareBeforeOverride(null);
        }
        setApiGenerating(true);
        if (kind) setApiGenerateKind(kind);
        setApiError(null);
        setApiWarning(null);
      }
      try {
        const data = await postRoomGenerate(roomSession, selectedStyle, selectedPalette, {
          shuffle: opts?.shuffle,
          currentResultImage: useCur ? apiResultImageUrl || undefined : undefined,
          strictLayoutLock: strictLayoutLockEnabled,
        });
        if (data.error) {
          if (mountedRef.current) setApiError(data.error);
          return false;
        }
        if (!data.imageUrl) {
          if (mountedRef.current) setApiError('No image returned from the server.');
          return false;
        }
        if (data.warning?.trim() && mountedRef.current) {
          setApiWarning(data.warning.trim());
        }
        const wm = await applyWatermarkToImage(data.imageUrl);
        onGeneratedImage?.(wm, data.imageUrl);
        onGenerationHistoryAppend?.(wm, data.imageUrl);
        return true;
      } catch (e) {
        if (mountedRef.current) {
          setApiError(e instanceof Error ? e.message : 'Generation failed.');
        }
        return false;
      } finally {
        if (!silent) {
          setApiGenerating(false);
          setApiGenerateKind(null);
        }
      }
    },
    [
      roomSession,
      selectedStyle,
      selectedPalette,
      strictLayoutLockEnabled,
      generatedImageUrl,
      apiResultImageUrl,
      onGeneratedImage,
      onGenerationHistoryAppend,
    ]
  );

  const handleRegenerateClick = useCallback(async () => {
    if (isMobile) {
      setMobileRightPanelOpen(false);
    }
    onRegenerate?.();
    await runGenerate({ shuffle: true, useCurrentResult: !!generatedImageUrl?.trim() }, 'regen');
  }, [isMobile, onRegenerate, runGenerate, generatedImageUrl]);

  const handleFinalizeClick = useCallback(() => {
    if (!roomSession) {
      setApiError(
        'Finish the room wizard first. With Vite dev, run the Next app on port 3000 so /api/generate is available.'
      );
      return;
    }
    if (isMobile) {
      setMobileFinalizeDismissed(true);
    }
    onFinalize?.();
  }, [roomSession, onFinalize, isMobile]);

  useEffect(() => {
    if (!showScanCanvas) {
      return;
    }

    setShowCompare(false);
    setDividerPos(0);
    setLabelsOpacity(0);

    const canvas = canvasRef.current;
    const wrapper = imagePanelRef.current;
    if (!canvas || !wrapper) return;

    const W = Math.max(1, Math.floor(renderedImageSize.w || wrapper.offsetWidth));
    const H = Math.max(1, Math.floor(renderedImageSize.h || wrapper.offsetHeight));
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const CELL_W = 48;
    const CELL_H = 26;
    const BEAM_H = 3;
    const TRAIL = 140;
    const DUR_DOWN = 3800;
    const DUR_UP = 3200;
    const GLOW_H = 56;
    let rafId: number;
    let cancelled = false;

    // Pre-generate dots
    interface Dot { x: number; y: number; r: number; seed: number }
    function generateDots(w: number, h: number): Dot[] {
      const count = Math.floor((w * h) / 5500);
      const cols = Math.floor(w / CELL_W);
      const rows = Math.floor(h / CELL_H);
      const dots: Dot[] = [];
      for (let i = 0; i < count; i++) {
        const col = Math.floor(Math.random() * (cols + 1));
        const row = Math.floor(Math.random() * (rows + 1));
        const rnd = Math.random();
        let r: number;
        if (rnd < 0.15) r = 7.5;
        else if (rnd < 0.50) r = 5.5;
        else if (rnd < 0.85) r = 4.0;
        else r = 2.5;
        dots.push({ x: col * CELL_W, y: row * CELL_H, r, seed: Math.random() });
      }
      return dots;
    }
    const dots = generateDots(W, H);

    function proximity(dist: number): number {
      return Math.pow(1 - Math.min(dist / TRAIL, 1), 1.8);
    }

    function drawFrame(beamY: number, goingDown: boolean) {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      const clampStart = goingDown ? Math.max(0, beamY - TRAIL) : beamY;
      const clampEnd = goingDown ? beamY : Math.min(H, beamY + TRAIL);

      // 1. Horizontal rows
      for (let y = Math.floor(clampStart / CELL_H) * CELL_H; y <= clampEnd; y += CELL_H) {
        if (y < clampStart) continue;
        const dist = Math.abs(beamY - y);
        const p = proximity(dist);
        const alpha = 0.07 + p * 0.75;
        ctx.strokeStyle = `rgba(120,220,255,${alpha})`;
        ctx.lineWidth = p > 0.75 ? 1.1 : p > 0.4 ? 0.75 : 0.4;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // 2. Vertical columns (segment by segment)
      for (let x = 0; x <= W; x += CELL_W) {
        for (let segY = Math.floor(clampStart / CELL_H) * CELL_H; segY < clampEnd; segY += CELL_H) {
          const segYEnd = Math.min(segY + CELL_H, clampEnd);
          if (segY < clampStart) continue;
          const midY = (segY + segYEnd) / 2;
          const dist = Math.abs(beamY - midY);
          const p = proximity(dist);
          const alpha = 0.07 + p * 0.75;
          ctx.strokeStyle = `rgba(120,220,255,${alpha})`;
          ctx.lineWidth = p > 0.75 ? 1.1 : p > 0.4 ? 0.75 : 0.4;
          ctx.beginPath();
          ctx.moveTo(x, segY);
          ctx.lineTo(x, segYEnd);
          ctx.stroke();
        }
      }

      // 3. Dots
      for (const d of dots) {
        if (d.y < clampStart || d.y > clampEnd) continue;
        const dist = Math.abs(beamY - d.y);
        const p = proximity(dist);
        if (p < 0.05) continue;
        const alpha = (0.35 + p * 0.65) * (0.6 + d.seed * 0.4);
        const radius = d.r * (0.6 + p * 0.7);
        // Outer soft ring
        ctx.fillStyle = `rgba(160,240,255,${alpha * 0.15})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, radius * 1.8, 0, Math.PI * 2);
        ctx.fill();
        // Core dot
        ctx.fillStyle = `rgba(200,248,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Glow (56px gradient before beam)
      if (goingDown) {
        const glowTop = Math.max(0, beamY - GLOW_H);
        const grad = ctx.createLinearGradient(0, glowTop, 0, beamY);
        grad.addColorStop(0, 'rgba(120,220,255,0)');
        grad.addColorStop(1, 'rgba(120,220,255,0.32)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, glowTop, W, beamY - glowTop);
      } else {
        const glowBottom = Math.min(H, beamY + GLOW_H);
        const grad = ctx.createLinearGradient(0, beamY, 0, glowBottom);
        grad.addColorStop(0, 'rgba(120,220,255,0.32)');
        grad.addColorStop(1, 'rgba(120,220,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, beamY, W, glowBottom - beamY);
      }

      // 5. Beam line
      ctx.fillStyle = 'rgba(180,242,255,1)';
      ctx.fillRect(0, beamY, W, BEAM_H);
    }

    function runPhase1() {
      let start: number | null = null;
      function tick(now: number) {
        if (cancelled) return;
        if (start === null) start = now;
        const t = Math.min((now - start) / DUR_DOWN, 1);
        drawFrame(t * H, true);
        if (t < 1) {
          rafId = requestAnimationFrame(tick);
        } else {
          runPhase2();
        }
      }
      rafId = requestAnimationFrame(tick);
    }

    function runPhase2() {
      let start: number | null = null;
      function tick(now: number) {
        if (cancelled) return;
        if (start === null) start = now;
        const t = Math.min((now - start) / DUR_UP, 1);
        drawFrame(H - t * H, false);
        if (t < 1) {
          rafId = requestAnimationFrame(tick);
        } else {
          runFadeOut();
        }
      }
      rafId = requestAnimationFrame(tick);
    }

    function runFadeOut() {
      let op = 1;
      function tick() {
        if (cancelled) return;
        op -= 0.035;
        if (op <= 0) {
          op = 0;
          ctx!.clearRect(0, 0, W, H);
          if (roomBusyRef.current) {
            runPhase1();
            return;
          }
          return;
        }
        ctx!.globalAlpha = op;
        drawFrame(0, false);
        ctx!.globalAlpha = 1;
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);
    }

    runPhase1();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [imageGenKey, showScanCanvas, renderedImageSize.w, renderedImageSize.h]);

  // Entrance animation for before/after slider
  useEffect(() => {
    if (roomImageBusy || isCustomisation) return;
    // Start the compare slider entrance
    setShowCompare(true);
    const startTime = performance.now();
    const SLIDE_DUR = 600;
    const FADE_DUR = 400;
    let rafId: number;

    function tick(now: number) {
      const elapsed = now - startTime;
      // Divider slides 0 → 50 over 600ms ease-out
      const slideT = Math.min(elapsed / SLIDE_DUR, 1);
      const eased = 1 - Math.pow(1 - slideT, 3); // ease-out cubic
      setDividerPos(eased * 50);
      // Labels fade in over 400ms
      const fadeT = Math.min(elapsed / FADE_DUR, 1);
      setLabelsOpacity(fadeT);

      if (slideT < 1 || fadeT < 1) {
        rafId = requestAnimationFrame(tick);
      }
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [roomImageBusy, isCustomisation]);

  // Drag handler for the divider
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const panel = imagePanelRef.current;
    if (!panel) return;

    const touchListenerOpts: AddEventListenerOptions = { passive: false };
    const flushPendingDividerPos = () => {
      if (pendingDividerPosRef.current == null) return;
      setDividerPos(pendingDividerPosRef.current);
      pendingDividerPosRef.current = null;
      dragRafRef.current = null;
    };

    const onMove = (ev: MouseEvent | TouchEvent) => {
      if ('touches' in ev) ev.preventDefault();
      const rect = panel.getBoundingClientRect();
      const clientX = 'touches' in ev ? ev.touches[0].clientX : (ev as MouseEvent).clientX;
      const pct = ((clientX - rect.left) / rect.width) * 100;
      pendingDividerPosRef.current = Math.max(5, Math.min(95, pct));
      if (dragRafRef.current == null) {
        dragRafRef.current = requestAnimationFrame(flushPendingDividerPos);
      }
    };
    const onUp = () => {
      setIsDragging(false);
      if (dragRafRef.current != null) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      if (pendingDividerPosRef.current != null) {
        setDividerPos(pendingDividerPosRef.current);
        pendingDividerPosRef.current = null;
      }
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove, touchListenerOpts);
      window.removeEventListener('touchend', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, touchListenerOpts);
    window.addEventListener('touchend', onUp);
  }, []);

  // Refs for precise indicator positioning
  const headerRef  = useRef<HTMLDivElement>(null);
  const colorRef   = useRef<HTMLSpanElement>(null);
  const styleRef   = useRef<HTMLSpanElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 42 });

  const measureIndicator = useCallback(() => {
    const header = headerRef.current;
    const target = activeTab === 'color' ? colorRef.current : styleRef.current;
    if (header && target) {
      const headerRect = header.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      setIndicatorStyle({
        left:  targetRect.left - headerRect.left,
        width: targetRect.width,
      });
    }
  }, [activeTab]);

  useLayoutEffect(() => {
    measureIndicator();
  }, [measureIndicator]);

  const palettes = activeTab === 'color' ? COLOR_PALETTES : STYLE_PALETTES;

  const layoutBefore =
    roomSession && roomSession.imagesDataUrl.length > 0
      ? roomSession.imagesDataUrl[roomSession.layoutIndex] ?? roomSession.imagesDataUrl[0]
      : selectedImageUrl;

  const beforeImage =
    (compareBeforeOverride && compareBeforeOverride.trim()) ||
    layoutBefore ||
    selectedImageUrl ||
    PLACEHOLDER_ROOM_IMAGE;

  const [showWatermark, setShowWatermark] = useState(true);

  const afterImage = useMemo(() => {
    const gen = generatedImageUrl?.trim();
    if (!gen) {
      // On first open (before first generation), prefer the locked layout image from the wizard session.
      return layoutBefore || selectedImageUrl || PLACEHOLDER_ROOM_IMAGE;
    }
    const raw = generatedImageRawUrl?.trim();
    if (!showWatermark && raw) {
      return raw;
    }
    return gen;
  }, [generatedImageUrl, generatedImageRawUrl, layoutBefore, selectedImageUrl, showWatermark]);

  useEffect(() => {
    setShowWatermark(true);
  }, [generatedImageUrl]);

  const objectCategoryList = useMemo(
    () => buildObjectCategoriesFromDetection(sceneRoomType, sceneComponents),
    [sceneRoomType, sceneComponents],
  );

  useEffect(() => {
    if (!isCustomisation) return;
    const src = (generatedImageRawUrl || generatedImageUrl || '').trim();
    if (!src || src === PLACEHOLDER_ROOM_IMAGE) return;
    let cancelled = false;
    setSceneDetectLoading(true);
    void (async () => {
      const dataUrl = await ensureGenerateImageDataUrl(src);
      if (cancelled) return;
      if (typeof dataUrl === 'object') {
        setSceneRoomType(null);
        setSceneComponents([]);
        setSceneDetectLoading(false);
        return;
      }
      const out = await postDetectScene(dataUrl);
      if (cancelled) return;
      setSceneRoomType(out.roomType ?? null);
      setSceneComponents(Array.isArray(out.components) ? out.components : []);
      setSceneDetectLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isCustomisation, generatedImageRawUrl, generatedImageUrl, imageGenKey]);

  useEffect(() => {
    const labels = objectCategoryList as readonly string[];
    if (selectedCategory && !labels.includes(selectedCategory)) {
      setSelectedCategory(null);
    }
    if (addSelectedCategory && !labels.includes(addSelectedCategory)) {
      setAddSelectedCategory(null);
    }
    if (replaceSelectedCategory && !labels.includes(replaceSelectedCategory)) {
      setReplaceSelectedCategory(null);
    }
  }, [objectCategoryList, selectedCategory, addSelectedCategory, replaceSelectedCategory]);

  // ── Toolbar: Share / Like / Download; 360° video via bottom-right FAB + modal ──
  const [liked, setLiked] = useState(false);
  const [tourModalOpen, setTourModalOpen] = useState(false);
  const [tourModalKey, setTourModalKey] = useState(0);

  const canUseRoomTourVideo =
    (roomSession?.configType === 'internal' || roomSession?.configType === 'external') &&
    Boolean(generatedImageUrl?.trim()) &&
    !apiGenerating &&
    !externalGeneratePending;

  const openTourVideoModal = useCallback(() => {
    setTourModalKey((k) => k + 1);
    setTourModalOpen(true);
  }, []);

  const handleShareCurrentResult = useCallback(async () => {
    const url = afterImage;
    if (!url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const mime = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/png';
      const file = new File([blob], `room-configuration-${Date.now()}.png`, { type: mime });

      // Web Share API with file
      if (typeof navigator !== 'undefined' && (navigator as any).canShare?.({ files: [file] })) {
        await (navigator as any).share({ files: [file], title: 'AI room configuration' });
        return;
      }

      // Fallback: share without file
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share({ title: 'AI room configuration', text: 'Room configuration preview' });
        return;
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      console.warn(e);
    }

    // Final fallback: copy page URL like main app
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.href : '');
        alert('Page link copied. Use Download to save the image file.');
      } else {
        alert('Use Download to save this image.');
      }
    } catch {
      alert('Use Download to save this image.');
    }
  }, [afterImage]);

  const handleDownloadCurrentResult = useCallback(async () => {
    const url = afterImage;
    if (!url) return;
    try {
      if (showWatermark) {
        await downloadImageWithLogo(url, `room-configuration-${Date.now()}.png`);
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = `room-configuration-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to download image.');
    }
  }, [afterImage, showWatermark]);

  const handleToggleLike = useCallback(() => {
    if (!afterImage) return;
    setLiked(prev => !prev);
  }, [afterImage]);

  const renderGenerationHistoryCards = () => {
    if (generationHistory.length === 0) {
      return (
        <div
          style={{
            padding: '20px 12px',
            textAlign: 'center',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.42)',
            lineHeight: 1.5,
            maxWidth: 230,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          No generations yet. Regenerate, finalize, or use Edit / Add / Replace / Erase—each new image is saved here, same as room
          configuration.
        </div>
      );
    }
    const reversed = [...generationHistory].reverse();
    return reversed.map((url, displayIdx) => {
      const versionNumber = displayIdx + 1;
      const isCurrent = !!(generatedImageUrl && generatedImageUrl === url);
      const originalIndex = generationHistory.length - 1 - displayIdx;
      return (
        <div
          key={`gh-${originalIndex}-${url.slice(0, 40)}`}
          onClick={() => {
            const raw = generationHistoryRaw[originalIndex] ?? url;
            onGeneratedImage?.(url, raw);
          }}
          style={{
            width: '230px',
            minHeight: '120px',
            borderRadius: '12px',
            background: isCurrent ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
            border: isCurrent ? '1px solid rgba(255,255,255,0.22)' : '1px solid rgba(255,255,255,0.08)',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'all 180ms ease',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (!isCurrent) {
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.07)';
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.14)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isCurrent) {
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)';
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)';
            }
          }}
        >
          <div style={{ height: '110px', overflow: 'hidden', position: 'relative', flexShrink: 0, background: 'rgba(0,0,0,0.35)' }}>
            <img src={url} alt={`Version ${versionNumber}`} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block' }} />
            {isCurrent && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
            )}
          </div>
          <div
            style={{
              padding: '8px 10px 10px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.88)', fontFamily: "'Inter', sans-serif" }}>
              Version {versionNumber}
              {isCurrent ? ' · current' : ''}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.70)',
                  fontFamily: "'Inter', sans-serif",
                  whiteSpace: 'nowrap',
                }}
              >
                {selectedStyle}
              </div>
            </div>
          </div>
        </div>
      );
    });
  };

  const playCompareReveal = useCallback(() => {
    setCustomisationConfirmed(true);
    setShowCompare(true);
    const startTime = performance.now();
    const SLIDE_DUR = 600;
    const FADE_DUR = 400;
    function tick(now: number) {
      const elapsed = now - startTime;
      const slideT = Math.min(elapsed / SLIDE_DUR, 1);
      const eased = 1 - Math.pow(1 - slideT, 3);
      setDividerPos(eased * 50);
      const fadeT = Math.min(elapsed / FADE_DUR, 1);
      setLabelsOpacity(fadeT);
      if (slideT < 1 || fadeT < 1) {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  }, []);

  const handleConfirmCustomisation = useCallback(async () => {
    const isEditCatalogFlow = !!(isCustomisation && customActiveTab === 'Edit' && selectedCategory);

    if (!isEditCatalogFlow) {
      if (customisationConfirmed) return;
      setCustomisationConfirmed(true);
      setShowCompare(false);
      setLabelsOpacity(0);
      return;
    }

    if (apiGenerating) return;
    if (isMobile) {
      // Mobile Edit flow: close right panel as soon as confirm is tapped.
      setMobileRightPanelOpen(false);
    }

    const hasPick =
      !!(selectedStyleSwatch?.trim()) ||
      !!(selectedMaterial?.trim()) ||
      !!(selectedColorDots && selectedColorDots.length > 0);
    if (!hasPick) {
      setApiError('Select a style, colour, or material for this category.');
      return;
    }

    if (!roomSession) {
      setApiError(
        'Finish the room wizard first. With Vite dev, run the Next app on port 3000 so /api/generate is available.'
      );
      return;
    }

    const layoutForCustom =
      roomSession.imagesDataUrl.length > 0
        ? roomSession.imagesDataUrl[roomSession.layoutIndex] ?? roomSession.imagesDataUrl[0]
        : selectedImageUrl;
    const currentResultImage =
      (apiResultImageUrl && apiResultImageUrl.trim()) ||
      (layoutForCustom && String(layoutForCustom).trim()) ||
      '';
    if (!currentResultImage) {
      setApiError('No image to customize. Generate or upload a room image first.');
      return;
    }

    const elementType = mapEditCategoryToApiElement(selectedCategory);
    const optionId =
      selectedStyleSwatch?.trim() ||
      (selectedMaterial ? `material:${selectedMaterial}` : '') ||
      (selectedColorDots?.length ? `color:${selectedColorDots.join(',')}` : '');
    if (!optionId) {
      setApiError('Select a style, colour, or material for this category.');
      return;
    }

    let label = 'Custom edit';
    let referenceImageUrl: string | undefined;

    const mytylesMatch = selectedStyleSwatch?.match(/^mytyles-(\d+)$/);
    if (mytylesMatch) {
      const id = Number(mytylesMatch[1]);
      const tile = editMytylesTiles.find((t) => t.id === id);
      if (tile) {
        label = tile.label;
        if (elementType === 'wall' || elementType === 'floor') {
          referenceImageUrl = tile.imageUrl;
        }
      }
    } else if (selectedStyleSwatch?.trim()) {
      const row = catalogStyleSwatchRows.find((r) => r.k === selectedStyleSwatch);
      if (row) {
        label = row.title;
        if (
          elementType === 'wall' ||
          elementType === 'floor' ||
          elementType === 'sofa' ||
          elementType === 'chair' ||
          elementType === 'bed' ||
          elementType === 'mattress' ||
          elementType === 'carpet' ||
          elementType === 'lighting' ||
          elementType === 'decor' ||
          elementType === 'table' ||
          elementType === 'desk' ||
          elementType === 'dining' ||
          elementType === 'cabinet'
        ) {
          referenceImageUrl = row.img;
        }
      }
    }

    if (selectedMaterial?.trim()) {
      if (!selectedStyleSwatch?.trim()) {
        label = `${selectedCategory} — ${selectedMaterial}`;
      }
      if (
        !referenceImageUrl &&
        selectedMaterialImageUrl &&
        (elementType === 'wall' ||
          elementType === 'floor' ||
          elementType === 'ceiling' ||
          elementType === 'sofa' ||
          elementType === 'chair' ||
          elementType === 'bed' ||
          elementType === 'mattress' ||
          elementType === 'carpet' ||
          elementType === 'lighting' ||
          elementType === 'decor' ||
          elementType === 'table' ||
          elementType === 'desk' ||
          elementType === 'dining' ||
          elementType === 'cabinet')
      ) {
        referenceImageUrl = selectedMaterialImageUrl;
      }
    }

    if (selectedColorDots?.length && !selectedStyleSwatch?.trim() && !selectedMaterial?.trim()) {
      label = `${selectedCategory} — colour update`;
    }

    const descParts: string[] = [
      `Apply the selected look to the ${selectedCategory.toLowerCase()} only (${elementType}). Keep the same room layout, camera angle, perspective, and all other surfaces and objects unchanged.`,
    ];
    if (selectedMaterial?.trim()) {
      descParts.push(`Material / finish: ${selectedMaterial}.`);
    }
    if (selectedColorDots?.length) {
      descParts.push(
        `Colours (hex): ${selectedColorDots.join(', ')} — use visibly on this element where appropriate.`
      );
    }
    if (referenceImageUrl && isCatalogProductStyleKey(selectedStyleSwatch)) {
      descParts.push(EXACT_CATALOG_OBJECT_INSTRUCTION);
    }

    const entry: CustomizationLabelEntry = {
      label: label.length > 120 ? `${label.slice(0, 117)}…` : label,
      description: descParts.join(' '),
      isDecor: false,
      action: 'edit',
      ...(referenceImageUrl ? { referenceImageUrl } : {}),
    };

    setCompareBeforeOverride(currentResultImage.trim() ? currentResultImage : null);
    setApiGenerating(true);
    setApiGenerateKind('customize');
    setApiError(null);
    setApiWarning(null);
    try {
      const data = await postCustomizationGenerate({
        configType: roomSession.configType,
        currentResultImage,
        layoutAnchorImage: roomSession.imagesDataUrl[roomSession.layoutIndex] ?? currentResultImage,
        customizationStyles: { [elementType]: optionId },
        customizationLabels: { [elementType]: entry },
        selectedStyle,
        selectedColorPaletteId: paletteDisplayNameToApiId(selectedPalette) ?? undefined,
      });
      if (data.error) {
        setApiError(data.error);
        return;
      }
      if (!data.imageUrl) {
        setApiError('No image returned from the server.');
        return;
      }
      if (data.warning?.trim()) {
        setApiWarning(data.warning.trim());
      }
      const wm = await applyWatermarkToImage(data.imageUrl);
      onGeneratedImage?.(wm, data.imageUrl);
      onGenerationHistoryAppend?.(wm, data.imageUrl);
      setCustomisationConfirmed(true);
      setShowCompare(false);
      setLabelsOpacity(0);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Customization failed.');
    } finally {
      setApiGenerating(false);
      setApiGenerateKind(null);
    }
  }, [
    isCustomisation,
    customActiveTab,
    selectedCategory,
    customisationConfirmed,
    playCompareReveal,
    apiGenerating,
    selectedStyleSwatch,
    selectedMaterial,
    selectedMaterialImageUrl,
    selectedColorDots,
    roomSession,
    selectedImageUrl,
    generatedImageUrl,
    apiResultImageUrl,
    editMytylesTiles,
    catalogStyleSwatchRows,
    selectedStyle,
    selectedPalette,
    onGeneratedImage,
    onGenerationHistoryAppend,
    isMobile,
  ]);

  const editCustomizationConfirmDisabled = useMemo(
    () =>
      apiGenerating ||
      externalGeneratePending ||
      !roomSession ||
      !selectedCategory ||
      (!(selectedStyleSwatch?.trim()) &&
        !(selectedMaterial?.trim()) &&
        !(selectedColorDots && selectedColorDots.length > 0)),
    [
      apiGenerating,
      externalGeneratePending,
      roomSession,
      selectedCategory,
      selectedStyleSwatch,
      selectedMaterial,
      selectedColorDots,
    ]
  );

  const addCatalogToImageDisabled = useMemo(
    () =>
      apiGenerating ||
      placingComponent ||
      externalGeneratePending ||
      !roomSession ||
      !captureLocked ||
      !addSelectedCategory ||
      (!(addSelectedStyleSwatch?.trim()) &&
        !(addSelectedMaterial?.trim()) &&
        !(addSelectedColorDots && addSelectedColorDots.length > 0)),
    [
      apiGenerating,
      placingComponent,
      externalGeneratePending,
      roomSession,
      captureLocked,
      addSelectedCategory,
      addSelectedStyleSwatch,
      addSelectedMaterial,
      addSelectedColorDots,
    ]
  );

  const replaceCatalogToImageDisabled = useMemo(
    () =>
      apiGenerating ||
      placingComponent ||
      externalGeneratePending ||
      !roomSession ||
      !captureLocked ||
      !replaceSelectedCategory ||
      (!(replaceSelectedStyleSwatch?.trim()) &&
        !(replaceSelectedMaterial?.trim()) &&
        !(replaceSelectedColorDots && replaceSelectedColorDots.length > 0)),
    [
      apiGenerating,
      placingComponent,
      externalGeneratePending,
      roomSession,
      captureLocked,
      replaceSelectedCategory,
      replaceSelectedStyleSwatch,
      replaceSelectedMaterial,
      replaceSelectedColorDots,
    ]
  );

  const showRightPanelDesktop =
    !isCustomisation ||
    (customActiveTab === 'Edit' && selectedCategory !== null) ||
    (customActiveTab === 'Add Object' && (addSelectedCategory !== null || addObjectSubPanel !== null)) ||
    (customActiveTab === 'Replace' && (replaceSelectedCategory !== null || replaceSubPanel !== null));
  const showRightPanel = isMobile ? mobileRightPanelOpen : showRightPanelDesktop;
  const isMobileDirectCaptureFlow =
    isMobile &&
    isCustomisation &&
    (customActiveTab === 'Add Object' || customActiveTab === 'Replace' || customActiveTab === 'Erase');
  const showEditSwitchers = isCustomisation && customActiveTab !== null;
  const historyRailCollapsed = !showEditSwitchers && !showHistoryPanel;
  const leftHistoryRailWidth = isMobile ? (mobileHistoryOpen ? 270 : 0) : (showEditSwitchers ? 270 : showHistoryPanel ? 270 : 44);

  const handleAddObjectApply = useCallback(async () => {
    if (customActiveTab !== 'Add Object' || apiGenerating) return;
    if (!captureLocked || !captureRect) {
      setApiError('Use Capture Area on the image, draw a box, then confirm the selection before adding.');
      return;
    }
    if (!roomSession) {
      setApiError(
        'Finish the room wizard first. With Vite dev, run the Next app on port 3000 so /api/edit is available.'
      );
      return;
    }
    if (roomSession.configType !== 'internal') {
      setApiError('Add object is only available for interior rooms.');
      return;
    }
    const panel = imagePanelRef.current;
    const imgEl = afterImageRef.current;
    if (!panel || !imgEl?.naturalWidth) {
      setApiError('Image not ready. Wait for the room photo to finish loading.');
      return;
    }
    const bbox = capturePercentRectToEraseRegion(
      panel.offsetWidth,
      panel.offsetHeight,
      imgEl.naturalWidth,
      imgEl.naturalHeight,
      captureRect,
      { yAnchorRatio: isMobile ? MOBILE_IMAGE_Y_ANCHOR : 0.5 }
    );
    if (!bbox) {
      setApiError('Selection too small or invalid. Draw a larger area on the image.');
      return;
    }
    const horizontalRegion =
      bbox.x + bbox.width / 2 < 0.33 ? 'left' : bbox.x + bbox.width / 2 > 0.66 ? 'right' : 'center';
    const verticalRegion =
      bbox.y + bbox.height / 2 < 0.33 ? 'upper' : bbox.y + bbox.height / 2 > 0.66 ? 'lower' : 'middle';

    let prompt = '';
    let referenceImageUrl: string | undefined;
    if (addObjectSubPanel === 'uploadedComponent' && confirmedUploadImages.length > 0) {
      const firstRef = confirmedUploadImages[0]?.trim();
      if (firstRef) {
        referenceImageUrl = firstRef;
      }
      prompt = [
        'Insert exactly ONE new photorealistic furniture/decor object completely INSIDE the white masked area. Do not move or repaint existing room objects.',
        'Use the uploaded reference image(s) as strict shape and material guidance. Rebuild in scene perspective; never paste as a flat cutout.',
        uploadedCompColour ? `Colour hint: ${uploadedCompColour}.` : '',
        'Placement rule: keep the full object (top, sides, legs/base) fully visible inside the mask with natural margin on all sides; no clipping outside mask boundaries.',
        'Match room lighting direction, cast a natural contact shadow, preserve floor/rug continuity under/around the object, and keep all pixels outside the mask unchanged.',
      ]
        .filter(Boolean)
        .join(' ');
    } else if (addObjectSubPanel === 'generatePrompt' && generatePromptText.trim()) {
      const userPromptLc = generatePromptText.trim().toLowerCase();
      const isFloorStandingObject = /(sofa|couch|chair|armchair|recliner|table|desk|cabinet|bed|stool|bench|ottoman|bookshelf|shelf|tv unit|console|wardrobe)/.test(userPromptLc);
      prompt = [
        buildStrictPromptObjectInstruction(generatePromptText),
        STRICT_PROMPT_OBJECT_RULES,
        isFloorStandingObject
          ? 'Placement lock for floor-standing object: ground it on the existing floor plane INSIDE the selected mask and keep the entire object fully visible with natural margins (no clipped top/sides/legs).'
          : 'Place exactly one requested object as the main subject fully inside the selected mask area with natural margins.',
        'Hard constraints: add a NEW object only; do not repaint existing objects. Render only inside the mask, keep outside pixels unchanged, preserve floor/rug/background continuity, and avoid edge halos or cut-off boundaries.',
      ].join(' ');
    } else if (!addObjectSubPanel && addSelectedCategory) {
      const hasPick =
        !!(addSelectedStyleSwatch?.trim()) ||
        !!(addSelectedMaterial?.trim()) ||
        !!(addSelectedColorDots && addSelectedColorDots.length > 0);
      if (!hasPick) {
        setApiError('Select a style, colour, or material for this category.');
        return;
      }
      const elementType = mapEditCategoryToApiElement(addSelectedCategory);
      let styleDesc = '';
      const mytylesMatch = addSelectedStyleSwatch?.match(/^mytyles-(\d+)$/);
      if (mytylesMatch) {
        const id = Number(mytylesMatch[1]);
        const tile = editMytylesTiles.find((t) => t.id === id);
        if (tile) {
          styleDesc = tile.label;
        }
      } else if (addSelectedStyleSwatch?.trim()) {
        const row = catalogStyleSwatchRows.find((r) => r.k === addSelectedStyleSwatch);
        if (row) {
          styleDesc = row.title;
        }
      }
      const parts: string[] = [
        `Add exactly ONE new ${addSelectedCategory.toLowerCase()} object (${elementType}) fully inside the white masked region. This is an insertion request, not a repaint request.`,
        'Do not edit, recolor, replace, move, or remove existing objects in the room.',
      ];
      if (styleDesc) parts.push(`Reference style / product: ${styleDesc}.`);
      if (addSelectedMaterial?.trim()) parts.push(`Material / finish: ${addSelectedMaterial.trim()}.`);
      if (addSelectedColorDots?.length) {
        parts.push(
          `Colours (hex): ${addSelectedColorDots.join(', ')} — use visibly on this element where appropriate.`
        );
      }
      if (isCatalogProductStyleKey(addSelectedStyleSwatch)) {
        parts.push(EXACT_CATALOG_OBJECT_INSTRUCTION);
      }
      parts.push(
        'Photorealistic, seamless blend. Match room lighting direction, perspective, and material highlights. Keep strict masked inpaint boundaries: render only in the masked area and do not modify pixels outside the mask.'
      );
      parts.push(
        'The full inserted object must remain completely visible inside the selected mask with natural margins (no clipped or cut-off edges).'
      );
      prompt = parts.join(' ');
    } else {
      setApiError('Select a category and style options, use Upload, or enter a text prompt before adding.');
      return;
    }
    prompt = [
      `INPAINTING TASK (EDIT LOGIC): modify ONLY the white masked region in this room image.`,
      prompt,
      `Area lock: use only the user-selected ${verticalRegion}-${horizontalRegion} capture area for the new object placement and keep the full object inside the selected box.`,
      'Keep all pixels outside the mask unchanged exactly. Preserve the same room layout, camera framing, perspective, and existing objects.',
    ].join(' ');

    const rawSource =
      (apiResultImageUrl && apiResultImageUrl.trim()) ||
      roomSession.imagesDataUrl[roomSession.layoutIndex] ||
      roomSession.imagesDataUrl[0] ||
      '';
    const currentResultImage = rawSource.trim();
    if (!currentResultImage) {
      setApiError('No image to customize. Generate or upload a room image first.');
      return;
    }

    const dataUrlResult = await ensureGenerateImageDataUrl(rawSource);
    if (typeof dataUrlResult === 'object' && 'error' in dataUrlResult) {
      setApiError(dataUrlResult.error);
      return;
    }
    const imageDataUrl = dataUrlResult;
    const addCategory = addSelectedCategory ? mapEditCategoryToApiElement(addSelectedCategory) : undefined;
    const maskDataUrl = await createMaskFromBoundingBox(imageDataUrl, bbox, {
      category: addCategory,
      expandGlobalSurface: false,
      featherPx: 0,
      autoFeatherForAdd: false,
    });
    if (!maskDataUrl) {
      setApiError('Could not build the selection mask. Try again.');
      return;
    }

    if (!addObjectSubPanel && addSelectedCategory) {
      const el = mapEditCategoryToApiElement(addSelectedCategory);
      const refEligible =
        el === 'wall' ||
        el === 'floor' ||
        el === 'ceiling' ||
        el === 'sofa' ||
        el === 'chair' ||
        el === 'bed' ||
        el === 'mattress' ||
        el === 'carpet' ||
        el === 'lighting' ||
        el === 'decor' ||
        el === 'table' ||
        el === 'desk' ||
        el === 'dining' ||
        el === 'cabinet';
      if (refEligible) {
        if (addSelectedStyleSwatch?.trim()) {
          const mytylesMatch = addSelectedStyleSwatch.match(/^mytyles-(\d+)$/);
          if (mytylesMatch) {
            const id = Number(mytylesMatch[1]);
            const tile = editMytylesTiles.find((t) => t.id === id);
            if (tile?.imageUrl?.trim()) {
              referenceImageUrl = tile.imageUrl.trim();
            }
          } else {
            const row = catalogStyleSwatchRows.find((r) => r.k === addSelectedStyleSwatch);
            if (row?.img?.trim()) {
              referenceImageUrl = row.img.trim();
            }
          }
        }
        if (!referenceImageUrl && addSelectedMaterial?.trim() && addSelectedMaterialImageUrl?.trim()) {
          referenceImageUrl = addSelectedMaterialImageUrl.trim();
        }
      }
      if (isCatalogProductStyleKey(addSelectedStyleSwatch) && !referenceImageUrl) {
        setApiError('Could not load the selected catalog reference image. Please select another swatch and try again.');
        return;
      }
    }

    let referenceImageDataUrl: string | undefined;
    if (referenceImageUrl?.trim()) {
      const conv = await ensureGenerateImageDataUrl(referenceImageUrl.trim());
      if (typeof conv === 'string') {
        referenceImageDataUrl = conv;
      }
    }

    if (rawSource.trim()) setCompareBeforeOverride(rawSource.trim());
    setShowSelectedAreaEffect(true);
    setApiGenerating(true);
    setApiGenerateKind('add');
    setApiError(null);
    setApiWarning(null);
    try {
      const data = await postRoomAdd({
        imageDataUrl,
        maskDataUrl,
        prompt,
        referenceImageDataUrl,
      });
      if (data.error) {
        setApiError(data.error);
        return;
      }
      if (!data.imageUrl) {
        setApiError('No image returned from the server.');
        return;
      }
      if (data.warning?.trim()) {
        setApiWarning(data.warning.trim());
      }
      const wm = await applyWatermarkToImage(data.imageUrl);
      onGeneratedImage?.(wm, data.imageUrl);
      onGenerationHistoryAppend?.(wm, data.imageUrl);
      setCaptureRect(null);
      setCaptureLocked(false);
      setCaptureThumb(null);
      setCapturePixelDims(null);
      setSelectedAction(null);
      setAddObjectSubPanel(null);
      setAddSelectedCategory(null);
      setAddPanelTab('Style');
      setAddSelectedStyleSwatch(null);
      setAddSelectedMaterial(null);
      setAddSelectedMaterialImageUrl(null);
      setAddSelectedColorDots(null);
      playCompareReveal();
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Add object failed.');
    } finally {
      setShowSelectedAreaEffect(false);
      setApiGenerating(false);
      setApiGenerateKind(null);
    }
  }, [
    customActiveTab,
    apiGenerating,
    captureLocked,
    captureRect,
    roomSession,
    addObjectSubPanel,
    addSelectedCategory,
    addSelectedStyleSwatch,
    addSelectedMaterial,
    addSelectedColorDots,
    catalogStyleSwatchRows,
    editMytylesTiles,
    confirmedUploadImages,
    uploadedCompColour,
    generatePromptText,
    generatedPreviewUrl,
    generatedImageUrl,
    apiResultImageUrl,
    onGenerationHistoryAppend,
    onGeneratedImage,
    playCompareReveal,
  ]);

  const handleGeneratePromptPreview = useCallback(async () => {
    if (!generatePromptText.trim() || generating) return;
    setGenerating(true);
    setGeneratedPreview(false);
    setGenerateScanning(true);
    setApiError(null);
    try {
      const size = 768;
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      const ctx = c.getContext('2d');
      if (!ctx) throw new Error('Could not create preview canvas.');
      // Neutral stage for prompt-only object preview.
      ctx.fillStyle = '#e9e9e6';
      ctx.fillRect(0, 0, size, size);
      const previewImageDataUrl = c.toDataURL('image/png', 0.95);

      const m = document.createElement('canvas');
      m.width = size;
      m.height = size;
      const mctx = m.getContext('2d');
      if (!mctx) throw new Error('Could not create preview mask.');
      mctx.fillStyle = '#000000';
      mctx.fillRect(0, 0, size, size);
      mctx.fillStyle = '#ffffff';
      mctx.fillRect(Math.round(size * 0.16), Math.round(size * 0.16), Math.round(size * 0.68), Math.round(size * 0.68));
      const previewMaskDataUrl = m.toDataURL('image/png', 0.95);

      const prompt = [
        buildStrictPromptObjectInstruction(generatePromptText),
        STRICT_PROMPT_OBJECT_RULES,
        'Generate ONLY one component on this neutral preview stage. No room/background decor, no extra objects, no labels, no text.',
      ].join(' ');

      const data = await postRoomAdd({
        imageDataUrl: previewImageDataUrl,
        maskDataUrl: previewMaskDataUrl,
        prompt,
      });
      if (data.error || !data.imageUrl) {
        throw new Error(data.error || 'No preview image returned.');
      }
      setGeneratedPreviewUrl(data.imageUrl);
      setGeneratedPreview(true);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to generate component preview.');
      setGeneratedPreview(false);
      setGeneratedPreviewUrl(null);
    } finally {
      setGenerateScanning(false);
      setGenerating(false);
    }
  }, [generatePromptText, generating]);

  const handleReplaceApply = useCallback(async () => {
    if (customActiveTab !== 'Replace' || apiGenerating) return;
    if (!captureLocked || !captureRect) {
      setApiError('Use Capture Area on the image, draw a box, then confirm the selection before replacing.');
      return;
    }
    if (!roomSession) {
      setApiError(
        'Finish the room wizard first. With Vite dev, run the Next app on port 3000 so /api/replace is available.'
      );
      return;
    }
    if (roomSession.configType !== 'internal') {
      setApiError('Replace is only available for interior rooms.');
      return;
    }
    const panel = imagePanelRef.current;
    const imgEl = afterImageRef.current;
    if (!panel || !imgEl?.naturalWidth) {
      setApiError('Image not ready. Wait for the room photo to finish loading.');
      return;
    }
    const bbox = capturePercentRectToEraseRegion(
      panel.offsetWidth,
      panel.offsetHeight,
      imgEl.naturalWidth,
      imgEl.naturalHeight,
      captureRect,
      { yAnchorRatio: isMobile ? MOBILE_IMAGE_Y_ANCHOR : 0.5 }
    );
    if (!bbox) {
      setApiError('Selection too small or invalid. Draw a larger area on the image.');
      return;
    }

    let optionId = '';
    let label = 'Custom replace';
    let referenceImageUrl: string | undefined;
    if (replaceSubPanel === 'generatePrompt') {
      if (!repPromptText.trim()) {
        setApiError('Enter a prompt describing the replacement, or use the catalog / Upload.');
        return;
      }
      optionId = `replace:${repPromptText.trim()}`;
      label = repPromptText.trim();
    } else if (replaceSubPanel === 'uploadedComponent') {
      if (repConfirmedUploadImages.length === 0) {
        setApiError('Confirm at least one uploaded reference image before replacing.');
        return;
      }
      optionId = 'replace:uploaded-reference';
      label = repUploadedCompColour?.trim()
        ? `Uploaded reference — ${repUploadedCompColour.trim()}`
        : 'Uploaded reference replacement';
      const firstRef = repConfirmedUploadImages[0]?.trim();
      if (firstRef) {
        referenceImageUrl = firstRef;
      }
    } else if (!replaceSubPanel && replaceSelectedCategory) {
      const hasPick =
        !!(replaceSelectedStyleSwatch?.trim()) ||
        !!(replaceSelectedMaterial?.trim()) ||
        !!(replaceSelectedColorDots && replaceSelectedColorDots.length > 0);
      if (!hasPick) {
        setApiError('Select a style, colour, or material for this category.');
        return;
      }
      const elementType = mapEditCategoryToApiElement(replaceSelectedCategory);
      optionId =
        replaceSelectedStyleSwatch?.trim() ||
        (replaceSelectedMaterial ? `material:${replaceSelectedMaterial}` : '') ||
        (replaceSelectedColorDots?.length ? `color:${replaceSelectedColorDots.join(',')}` : '');
      if (!optionId) {
        setApiError('Select a style, colour, or material for this category.');
        return;
      }
      let styleDesc = '';
      const mytylesMatch = replaceSelectedStyleSwatch?.match(/^mytyles-(\d+)$/);
      if (mytylesMatch) {
        const id = Number(mytylesMatch[1]);
        const tile = editMytylesTiles.find((t) => t.id === id);
        if (tile) {
          styleDesc = tile.label;
          label = tile.label;
          if (elementType === 'wall' || elementType === 'floor') {
            referenceImageUrl = tile.imageUrl;
          }
        }
      } else if (replaceSelectedStyleSwatch?.trim()) {
        const row = catalogStyleSwatchRows.find((r) => r.k === replaceSelectedStyleSwatch);
        if (row) {
          styleDesc = row.title;
          label = row.title;
          if (
            elementType === 'wall' ||
            elementType === 'floor' ||
            elementType === 'ceiling' ||
            elementType === 'sofa' ||
            elementType === 'chair' ||
            elementType === 'bed' ||
            elementType === 'mattress' ||
            elementType === 'carpet' ||
            elementType === 'lighting' ||
            elementType === 'decor' ||
            elementType === 'table' ||
            elementType === 'desk' ||
            elementType === 'dining' ||
            elementType === 'cabinet'
          ) {
            referenceImageUrl = row.img;
          }
        }
      }
      if (replaceSelectedMaterial?.trim()) {
        if (!replaceSelectedStyleSwatch?.trim()) {
          label = `${replaceSelectedCategory} — ${replaceSelectedMaterial}`;
        }
      }
      if (replaceSelectedColorDots?.length && !replaceSelectedStyleSwatch?.trim() && !replaceSelectedMaterial?.trim()) {
        label = `${replaceSelectedCategory} — colour update`;
      }
      const refEligible =
        elementType === 'wall' ||
        elementType === 'floor' ||
        elementType === 'ceiling' ||
        elementType === 'sofa' ||
        elementType === 'chair' ||
        elementType === 'bed' ||
        elementType === 'mattress' ||
        elementType === 'carpet' ||
        elementType === 'lighting' ||
        elementType === 'decor' ||
        elementType === 'table' ||
        elementType === 'desk' ||
        elementType === 'dining' ||
        elementType === 'cabinet';
      if (refEligible) {
        if (
          !referenceImageUrl &&
          replaceSelectedMaterial?.trim() &&
          replaceSelectedMaterialImageUrl?.trim()
        ) {
          referenceImageUrl = replaceSelectedMaterialImageUrl.trim();
        }
      }
      if (isCatalogProductStyleKey(replaceSelectedStyleSwatch) && !referenceImageUrl) {
        setApiError('Could not load the selected catalog reference image. Please select another swatch and try again.');
        return;
      }
    } else {
      setApiError('Select a category and style options, use Upload, or enter a text prompt before replacing.');
      return;
    }

    const rawSource =
      (apiResultImageUrl && apiResultImageUrl.trim()) ||
      roomSession.imagesDataUrl[roomSession.layoutIndex] ||
      roomSession.imagesDataUrl[0] ||
      '';
    const currentResultImage = rawSource.trim();
    if (!currentResultImage) {
      setApiError('No image to customize. Generate or upload a room image first.');
      return;
    }
    const elementType = mapEditCategoryToApiElement(replaceSelectedCategory || 'decor');
    const isGlobalSurfaceReplace =
      elementType === 'wall' || elementType === 'floor' || elementType === 'ceiling';
    const replaceMaskRegion = isGlobalSurfaceReplace
      ? bbox
      : (() => {
          // Replace should follow edit-like behavior: slightly grow object masks so
          // the model can replace the full object instead of producing half-cut edits.
          const grow = 0.35;
          const x = Math.max(0, bbox.x - bbox.width * grow);
          const y = Math.max(0, bbox.y - bbox.height * grow);
          const r = Math.min(1, bbox.x + bbox.width * (1 + grow));
          const b = Math.min(1, bbox.y + bbox.height * (1 + grow));
          return {
            x,
            y,
            width: Math.max(0.02, r - x),
            height: Math.max(0.02, b - y),
          };
        })();
    const horizontal =
      bbox.x + bbox.width / 2 < 0.33 ? 'left' : bbox.x + bbox.width / 2 > 0.66 ? 'right' : 'center'
    const vertical =
      bbox.y + bbox.height / 2 < 0.33 ? 'upper' : bbox.y + bbox.height / 2 > 0.66 ? 'lower' : 'middle'
    const descParts: string[] = [
      `Apply the selected look to only the ${replaceSelectedCategory?.toLowerCase() || 'selected object'} (${elementType}) in the user-selected ${vertical}-${horizontal} region. Keep the same room layout, camera angle, perspective, and all other surfaces and objects unchanged.`,
      'Only the object inside the selected region should change. Do not alter matching objects elsewhere in the room.',
    ];
    if (replaceSelectedMaterial?.trim()) {
      descParts.push(`Material / finish: ${replaceSelectedMaterial}.`);
    }
    if (replaceSelectedColorDots?.length) {
      descParts.push(
        `Colours (hex): ${replaceSelectedColorDots.join(', ')} — use visibly on this element where appropriate.`
      );
    }
    if (repUploadedCompColour?.trim() && replaceSubPanel === 'uploadedComponent') {
      descParts.push(`Preferred colour: ${repUploadedCompColour.trim()}.`);
    }
    if (referenceImageUrl && isCatalogProductStyleKey(replaceSelectedStyleSwatch)) {
      descParts.push(EXACT_CATALOG_OBJECT_INSTRUCTION);
    }
    const replaceDescription = descParts.join(' ');
    const entry: CustomizationLabelEntry = {
      label: label.length > 120 ? `${label.slice(0, 117)}…` : label,
      description: replaceDescription,
      isDecor: false,
      action: 'replace',
      ...(referenceImageUrl ? { referenceImageUrl } : {}),
    };

    if (currentResultImage) setCompareBeforeOverride(currentResultImage);
    setShowSelectedAreaEffect(true);
    setApiGenerating(true);
    setApiGenerateKind('replace');
    setApiError(null);
    setApiWarning(null);
    try {
      const data = await postCustomizationGenerate({
        configType: roomSession.configType,
        currentResultImage,
        layoutAnchorImage: roomSession.imagesDataUrl[roomSession.layoutIndex] ?? currentResultImage,
        customizationStyles: { [elementType]: optionId },
        customizationLabels: { [elementType]: entry },
        selectedStyle,
        selectedColorPaletteId: paletteDisplayNameToApiId(selectedPalette) ?? undefined,
      });
      if (data.error) {
        setApiError(data.error);
        return;
      }
      if (!data.imageUrl) {
        setApiError('No image returned from the server.');
        return;
      }
      if (data.warning?.trim()) {
        setApiWarning(data.warning.trim());
      }
      const wm = await applyWatermarkToImage(data.imageUrl);
      onGeneratedImage?.(wm, data.imageUrl);
      onGenerationHistoryAppend?.(wm, data.imageUrl);
      setCaptureRect(null);
      setCaptureLocked(false);
      setCaptureThumb(null);
      setCapturePixelDims(null);
      setSelectedAction(null);
      setReplaceSubPanel(null);
      setReplaceSelectedCategory(null);
      setReplacePanelTab('Style');
      setReplaceSelectedStyleSwatch(null);
      setReplaceSelectedMaterial(null);
      setReplaceSelectedMaterialImageUrl(null);
      setReplaceSelectedColorDots(null);
      playCompareReveal();
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Replace failed.');
    } finally {
      setShowSelectedAreaEffect(false);
      setApiGenerating(false);
      setApiGenerateKind(null);
    }
  }, [
    customActiveTab,
    apiGenerating,
    captureLocked,
    captureRect,
    roomSession,
    replaceSubPanel,
    replaceSelectedCategory,
    replaceSelectedStyleSwatch,
    replaceSelectedMaterial,
    replaceSelectedColorDots,
    catalogStyleSwatchRows,
    editMytylesTiles,
    repConfirmedUploadImages,
    repUploadedCompColour,
    repPromptText,
    generatedImageUrl,
    apiResultImageUrl,
    onGeneratedImage,
    onGenerationHistoryAppend,
    playCompareReveal,
  ]);

  const handleEraseApply = useCallback(async () => {
    if (!roomSession || apiGenerating) return;
    if (roomSession.configType !== 'internal') {
      setApiError('Erase is only available for interior rooms.');
      return;
    }
    const useFullComponentsErase =
      isCustomComponentConfiguration && selectedAction === 'erase-full-components';
    if (!useFullComponentsErase && (!captureLocked || !captureRect)) {
      setApiError('Draw and lock a selection before applying erase.');
      return;
    }
    const panel = imagePanelRef.current;
    const imgEl = afterImageRef.current;
    if (!panel || !imgEl?.naturalWidth) {
      setApiError('Image not ready. Wait for the room photo to finish loading.');
      return;
    }
    const eraseRegion = useFullComponentsErase
      ? { x: 0.02, y: 0.02, width: 0.96, height: 0.96 }
      : captureRect
        ? capturePercentRectToEraseRegion(
            panel.offsetWidth,
            panel.offsetHeight,
            imgEl.naturalWidth,
            imgEl.naturalHeight,
            captureRect,
            { yAnchorRatio: isMobile ? MOBILE_IMAGE_Y_ANCHOR : 0.5 }
          )
        : null;
    if (!eraseRegion) {
      setApiError('Selection too small or invalid. Draw a larger area on the image.');
      return;
    }
    const rawSource =
      (apiResultImageUrl && apiResultImageUrl.trim()) ||
      roomSession.imagesDataUrl[roomSession.layoutIndex] ||
      roomSession.imagesDataUrl[0] ||
      '';
    const dataUrlResult = await ensureGenerateImageDataUrl(rawSource);
    if (typeof dataUrlResult === 'object' && 'error' in dataUrlResult) {
      setApiError(dataUrlResult.error);
      return;
    }
    if (rawSource.trim()) setCompareBeforeOverride(rawSource.trim());
    setShowSelectedAreaEffect(true);
    setApiGenerating(true);
    setApiGenerateKind('erase');
    setApiError(null);
    setApiWarning(null);
    try {
      const data = !useFullComponentsErase
        ? await (async () => {
            // Strict region erase: always use hard mask edit path (no loose fallback).
            const eraseMaskDataUrl = await createMaskFromBoundingBox(dataUrlResult, eraseRegion, {
              expandGlobalSurface: false,
            });
            if (!eraseMaskDataUrl) {
              return { error: 'Could not build the selection mask. Try again.' };
            }
            const erasePrompt = [
              'STRICT MASK ERASE: remove all visible objects/content inside the white mask and reconstruct only plausible room background.',
              'Boundary lock: edits must remain 100% inside the mask; do not change any pixel outside the mask.',
              'Do not add new furniture/decor/textures that are not natural continuation of surrounding wall/floor/rug.',
              'Keep perspective, lighting, and texture continuity at mask edges with a seamless blend.',
            ].join(' ');
            return postRoomReplace({
              imageDataUrl: dataUrlResult,
              maskDataUrl: eraseMaskDataUrl,
              prompt: erasePrompt,
            });
          })()
        : await postRoomErase({
            configType: roomSession.configType,
            sourceImageDataUrl: dataUrlResult,
            eraseRegion,
            eraseMode: 'full-components',
          });
      if (data.error) {
        setApiError(data.error);
        return;
      }
      if (!data.imageUrl) {
        setApiError('No image returned from erase.');
        return;
      }
      if (data.warning?.trim()) {
        setApiWarning(data.warning.trim());
      }
      const wm = await applyWatermarkToImage(data.imageUrl);
      onGeneratedImage?.(wm, data.imageUrl);
      onGenerationHistoryAppend?.(wm, data.imageUrl);
      setCaptureRect(null);
      setCaptureLocked(false);
      setCaptureThumb(null);
      setCapturePixelDims(null);
      setSelectedAction(null);
      playCompareReveal();
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Erase failed.');
    } finally {
      setShowSelectedAreaEffect(false);
      setApiGenerating(false);
      setApiGenerateKind(null);
    }
  }, [
    captureLocked,
    captureRect,
    roomSession,
    apiGenerating,
    isCustomComponentConfiguration,
    selectedAction,
    generatedImageUrl,
    apiResultImageUrl,
    onGeneratedImage,
    onGenerationHistoryAppend,
    playCompareReveal,
  ]);

  const canApplyErase =
    !!roomSession &&
    !apiGenerating &&
    !externalGeneratePending &&
    (captureLocked || (isCustomComponentConfiguration && selectedAction === 'erase-full-components'));

  // ── Place component handler (Add / Replace → room editor APIs; other demos → UI animation) ──
  const handlePlaceComponent = useCallback(() => {
    if (customActiveTab === 'Add Object') {
      if (isMobile) {
        setMobileRightPanelOpen(false);
      }
      void handleAddObjectApply();
      return;
    }
    if (customActiveTab === 'Replace') {
      if (isMobile) {
        // Mobile UX: close both panels immediately after tapping Replace.
        setMobileRightPanelOpen(false);
        setMobileHistoryOpen(false);
      }
      void handleReplaceApply();
      return;
    }
    if (placingComponent) return;
    setPlacingComponent(true);
    setPlacingPhase('animating');
    setTimeout(() => {
      setPlacingPhase('fadeout');
      setTimeout(() => {
        setPlacingComponent(false);
        setPlacingPhase('idle');
        // Clear selection overlay: rect, lock, handles, cancel button, left panel preview
        setCaptureRect(null);
        setCaptureLocked(false);
        setCaptureDrawing(false);
        setCaptureStart(null);
        setCaptureDragMode('none');
        setCaptureDragOrigin(null);
      }, 400);
    }, 3000);
  }, [placingComponent, customActiveTab, handleAddObjectApply, handleReplaceApply, isMobile]);

  // ── Capture area helpers ──
  const getRelPosFromClient = (clientX: number, clientY: number) => {
    const panel = imagePanelRef.current;
    if (!panel) return { x: 0, y: 0 };
    const r = panel.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * 100, y: ((clientY - r.top) / r.height) * 100 };
  };

  const getRelPos = (e: React.MouseEvent) => {
    return getRelPosFromClient(e.clientX, e.clientY);
  };

  const handleCaptureMouseDown = (e: React.MouseEvent) => {
    if (!captureMode) return;
    e.preventDefault();
    const pos = getRelPos(e);

    // If locked, check if clicking a handle or inside rect
    if (captureLocked && captureRect) {
      const HANDLE = 1.5; // % threshold for handle hit
      const r = captureRect;
      const corners: Array<{ key: 'nw' | 'ne' | 'sw' | 'se'; cx: number; cy: number }> = [
        { key: 'nw', cx: r.x, cy: r.y },
        { key: 'ne', cx: r.x + r.w, cy: r.y },
        { key: 'sw', cx: r.x, cy: r.y + r.h },
        { key: 'se', cx: r.x + r.w, cy: r.y + r.h },
      ];
      for (const c of corners) {
        if (Math.abs(pos.x - c.cx) < HANDLE && Math.abs(pos.y - c.cy) < HANDLE) {
          setCaptureDragMode(c.key);
          setCaptureDragOrigin({ mx: pos.x, my: pos.y, rect: { ...r } });
          return;
        }
      }
      // Inside rect → move
      if (pos.x >= r.x && pos.x <= r.x + r.w && pos.y >= r.y && pos.y <= r.y + r.h) {
        setCaptureDragMode('move');
        setCaptureDragOrigin({ mx: pos.x, my: pos.y, rect: { ...r } });
        return;
      }
      // Outside rect → cancel
      setCaptureRect(null);
      setCaptureLocked(false);
      setCaptureThumb(null);
      setCapturePixelDims(null);
      return;
    }

    // Start new drawing
    setCaptureDrawing(true);
    setCaptureStart(pos);
    setCaptureRect(null);
    setCaptureLocked(false);
  };

  const handleCaptureMouseMove = (e: React.MouseEvent) => {
    if (!captureMode) return;
    const pos = getRelPos(e);

    if (captureDrawing && captureStart) {
      const x = Math.min(captureStart.x, pos.x);
      const y = Math.min(captureStart.y, pos.y);
      const w = Math.abs(pos.x - captureStart.x);
      const h = Math.abs(pos.y - captureStart.y);
      setCaptureRect({ x, y, w, h });
      return;
    }

    if (captureDragMode !== 'none' && captureDragOrigin && captureRect) {
      const dx = pos.x - captureDragOrigin.mx;
      const dy = pos.y - captureDragOrigin.my;
      const o = captureDragOrigin.rect;
      if (captureDragMode === 'move') {
        setCaptureRect({ x: Math.max(0, Math.min(100 - o.w, o.x + dx)), y: Math.max(0, Math.min(100 - o.h, o.y + dy)), w: o.w, h: o.h });
      } else {
        let nx = o.x, ny = o.y, nw = o.w, nh = o.h;
        if (captureDragMode === 'nw') { nx = o.x + dx; ny = o.y + dy; nw = o.w - dx; nh = o.h - dy; }
        if (captureDragMode === 'ne') { ny = o.y + dy; nw = o.w + dx; nh = o.h - dy; }
        if (captureDragMode === 'sw') { nx = o.x + dx; nw = o.w - dx; nh = o.h + dy; }
        if (captureDragMode === 'se') { nw = o.w + dx; nh = o.h + dy; }
        if (nw < 2) nw = 2;
        if (nh < 2) nh = 2;
        setCaptureRect({ x: Math.max(0, nx), y: Math.max(0, ny), w: Math.min(100 - Math.max(0, nx), nw), h: Math.min(100 - Math.max(0, ny), nh) });
      }
    }
  };

  const handleCaptureMouseUp = () => {
    if (captureDrawing && captureRect && captureRect.w > 1 && captureRect.h > 1) {
      setCaptureLocked(true);
      if (isMobile && (customActiveTab === 'Add Object' || customActiveTab === 'Replace')) {
        // After area capture, bring back the original left panel flow (category/action panel).
        setMobileRightPanelOpen(false);
        setMobileHistoryOpen(true);
      }
      // Cropped thumbnail for left rail — draw from the on-screen img to avoid CORS/taint on a second Image load.
      const panel = imagePanelRef.current;
      const imgEl = afterImageRef.current;
      if (panel && imgEl?.naturalWidth && imgEl.naturalHeight) {
        const panelW = panel.offsetWidth;
        const panelH = panel.offsetHeight;
        const sw = (captureRect.w / 100) * panelW;
        const sh = (captureRect.h / 100) * panelH;
        setCapturePixelDims({ w: Math.round(sw), h: Math.round(sh) });
        const bbox = capturePercentRectToEraseRegion(
          panelW,
          panelH,
          imgEl.naturalWidth,
          imgEl.naturalHeight,
          captureRect,
          { yAnchorRatio: isMobile ? MOBILE_IMAGE_Y_ANCHOR : 0.5 }
        );
        if (bbox) {
          const sx = bbox.x * imgEl.naturalWidth;
          const sy = bbox.y * imgEl.naturalHeight;
          const cw = Math.max(1, Math.round(bbox.width * imgEl.naturalWidth));
          const ch = Math.max(1, Math.round(bbox.height * imgEl.naturalHeight));
          const c = document.createElement('canvas');
          c.width = cw;
          c.height = ch;
          const ctx = c.getContext('2d');
          if (ctx) {
            try {
              ctx.drawImage(imgEl, sx, sy, cw, ch, 0, 0, cw, ch);
              setCaptureThumb(c.toDataURL('image/jpeg', 0.85));
            } catch {
              setCaptureThumb(null);
            }
          }
        }
      }
    } else if (captureDrawing) {
      setCaptureRect(null);
    }
    setCaptureDrawing(false);
    setCaptureStart(null);
    setCaptureDragMode('none');
    setCaptureDragOrigin(null);
  };

  const handleCaptureTouchStart = (e: React.TouchEvent) => {
    if (!captureMode) return;
    const t = e.touches[0];
    if (!t) return;
    e.preventDefault();
    const pos = getRelPosFromClient(t.clientX, t.clientY);

    if (captureLocked && captureRect) {
      const HANDLE = 1.5;
      const r = captureRect;
      const corners: Array<{ key: 'nw' | 'ne' | 'sw' | 'se'; cx: number; cy: number }> = [
        { key: 'nw', cx: r.x, cy: r.y },
        { key: 'ne', cx: r.x + r.w, cy: r.y },
        { key: 'sw', cx: r.x, cy: r.y + r.h },
        { key: 'se', cx: r.x + r.w, cy: r.y + r.h },
      ];
      for (const c of corners) {
        if (Math.abs(pos.x - c.cx) < HANDLE && Math.abs(pos.y - c.cy) < HANDLE) {
          setCaptureDragMode(c.key);
          setCaptureDragOrigin({ mx: pos.x, my: pos.y, rect: { ...r } });
          return;
        }
      }
      if (pos.x >= r.x && pos.x <= r.x + r.w && pos.y >= r.y && pos.y <= r.y + r.h) {
        setCaptureDragMode('move');
        setCaptureDragOrigin({ mx: pos.x, my: pos.y, rect: { ...r } });
        return;
      }
      setCaptureRect(null);
      setCaptureLocked(false);
      setCaptureThumb(null);
      setCapturePixelDims(null);
      return;
    }

    setCaptureDrawing(true);
    setCaptureStart(pos);
    setCaptureRect(null);
    setCaptureLocked(false);
  };

  const handleCaptureTouchMove = (e: React.TouchEvent) => {
    if (!captureMode) return;
    const t = e.touches[0];
    if (!t) return;
    e.preventDefault();
    const pos = getRelPosFromClient(t.clientX, t.clientY);

    if (captureDrawing && captureStart) {
      const x = Math.min(captureStart.x, pos.x);
      const y = Math.min(captureStart.y, pos.y);
      const w = Math.abs(pos.x - captureStart.x);
      const h = Math.abs(pos.y - captureStart.y);
      setCaptureRect({ x, y, w, h });
      return;
    }

    if (captureDragMode !== 'none' && captureDragOrigin && captureRect) {
      const dx = pos.x - captureDragOrigin.mx;
      const dy = pos.y - captureDragOrigin.my;
      const o = captureDragOrigin.rect;
      if (captureDragMode === 'move') {
        setCaptureRect({ x: Math.max(0, Math.min(100 - o.w, o.x + dx)), y: Math.max(0, Math.min(100 - o.h, o.y + dy)), w: o.w, h: o.h });
      } else {
        let nx = o.x, ny = o.y, nw = o.w, nh = o.h;
        if (captureDragMode === 'nw') { nx = o.x + dx; ny = o.y + dy; nw = o.w - dx; nh = o.h - dy; }
        if (captureDragMode === 'ne') { ny = o.y + dy; nw = o.w + dx; nh = o.h - dy; }
        if (captureDragMode === 'sw') { nx = o.x + dx; nw = o.w - dx; nh = o.h + dy; }
        if (captureDragMode === 'se') { nw = o.w + dx; nh = o.h + dy; }
        if (nw < 2) nw = 2;
        if (nh < 2) nh = 2;
        setCaptureRect({ x: Math.max(0, nx), y: Math.max(0, ny), w: Math.min(100 - Math.max(0, nx), nw), h: Math.min(100 - Math.max(0, ny), nh) });
      }
    }
  };

  return (
    <>
    <div
      style={{
        display:        'flex',
        flexDirection:  'row',
        width:          '100%',
        height:         '100%',
        gap:            isMobile ? '0px' : '12px',
        fontFamily:     "'Inter', sans-serif",
        overflow:       isCustomisation ? 'visible' : 'hidden',
        position:       'relative',
      }}
    >
      {isMobile && (mobileHistoryOpen || mobileRightPanelOpen) && (
        <button
          type="button"
          aria-label="Close side panels"
          onClick={() => {
            setMobileHistoryOpen(false);
            setMobileRightPanelOpen(false);
          }}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 54,
            background: 'rgba(0,0,0,0.18)',
            border: 'none',
            cursor: 'pointer',
          }}
        />
      )}

      {isMobile && !isMobileDirectCaptureFlow && (
        <button
          type="button"
          aria-label={mobileHistoryOpen ? 'Hide left panel' : 'Show left panel'}
          onClick={() => {
            setMobileHistoryOpen((v) => !v);
            if (!mobileHistoryOpen) setMobileRightPanelOpen(false);
          }}
          style={{
            position: 'absolute',
            left: '6px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 57,
            width: '26px',
            height: '76px',
            borderRadius: '12px',
            border: `1px solid ${mobileHistoryOpen ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.20)'}`,
            background: mobileHistoryOpen ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.58)',
            color: 'rgba(255,255,255,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
          }}
          title={mobileHistoryOpen ? 'Hide left panel' : 'Show left panel'}
        >
          <span
            style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              fontFamily: "'Inter', sans-serif",
              userSelect: 'none',
            }}
          >
            {mobileHistoryOpen ? 'HIDE' : 'OPEN'}
          </span>
        </button>
      )}

      {isMobile && (
        <button
          type="button"
          aria-label={mobileRightPanelOpen ? 'Hide tools panel' : 'Show tools panel'}
          onClick={() => {
            setMobileRightPanelOpen((v) => !v);
            if (!mobileRightPanelOpen) setMobileHistoryOpen(false);
          }}
          style={{
            position: 'absolute',
            right: '0px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 57,
            width: '28px',
            height: '76px',
            borderRadius: '12px 0 0 12px',
            border: `1px solid ${mobileRightPanelOpen ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.20)'}`,
            background: mobileRightPanelOpen ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.58)',
            color: 'rgba(255,255,255,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
          }}
          title={mobileRightPanelOpen ? 'Hide tools panel' : 'Show tools panel'}
        >
          <span
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ opacity: 0.95, flexShrink: 0 }}
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m12 8-4 4 4 4" />
              <path d="M16 12H8" />
            </svg>
          </span>
        </button>
      )}

      {/* ── LEFT: History Panel ──────────────────────────────────────────── */}
      <div
        style={{
          width:                leftHistoryRailWidth,
          flexShrink:           0,
          minWidth:             0,
          height:               '100%',
          background:           'rgba(0,0,0,0.22)',
          borderRadius:         '16px',
          border:               historyRailCollapsed ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.08)',
          boxShadow:            historyRailCollapsed ? '0px 4px 16px 0px rgba(0,0,0,0.25)' : '0px 8px 32px 0px rgba(0,0,0,0.4)',
          display:              'flex',
          flexDirection:        'column',
          overflow:             'hidden',
          backdropFilter:       'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          transition:           'width 280ms ease, border 280ms ease, box-shadow 280ms ease',
          position:             isMobile ? 'absolute' : 'relative',
          left:                 isMobile ? '0px' : undefined,
          top:                  isMobile ? '0px' : undefined,
          bottom:               isMobile ? '0px' : undefined,
          zIndex:               isMobile ? 55 : undefined,
        }}
      >
        {showEditSwitchers ? (
          <>
            {/* Left panel switcher */}
            <div style={{ padding: '12px 16px 0', borderBottom: '0.5px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'row', flexShrink: 0, transition: 'opacity 300ms ease' }}>
              {customActiveTab === 'Erase' ? (
                <>
                  {(['Objects', 'History'] as const).map(tab => {
                    const isActive = eraseLeftTab === tab;
                    return (
                      <div
                        key={tab}
                        onClick={() => setEraseLeftTab(tab)}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', paddingBottom: '10px', position: 'relative' }}
                      >
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: isActive ? 500 : 400, color: isActive ? '#ffffff' : 'rgba(255,255,255,0.4)', transition: 'color 200ms ease', userSelect: 'none', whiteSpace: 'nowrap' }}>{tab}</span>
                        <div style={{ position: 'absolute', bottom: '-0.5px', left: '50%', transform: 'translateX(-50%)', height: '2px', background: '#ffffff', borderRadius: '1px', width: isActive ? 'auto' : '0px', paddingLeft: isActive ? '0px' : '0px', paddingRight: isActive ? '0px' : '0px', opacity: isActive ? 1 : 0, transition: 'opacity 200ms ease' }}>
                          <span style={{ visibility: 'hidden', fontSize: '13px', fontWeight: 500, fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>{tab}</span>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <>
                  {((customActiveTab === 'Edit' || customActiveTab === 'Add Object' || customActiveTab === 'Replace' ? ['Object Categories', 'History'] : ['Action', 'History']) as ('Object Categories' | 'Action' | 'History')[]).map(tab => {
                    const isFirstTab = tab !== 'History';
                    const isActive = tab === 'History' ? leftPanelTab === 'History' : leftPanelTab !== 'History';
                    return (
                      <div
                        key={tab}
                        onClick={() => setLeftPanelTab(tab)}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', paddingBottom: '10px', position: 'relative' }}
                      >
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: isActive ? 500 : 400, color: isActive ? '#ffffff' : 'rgba(255,255,255,0.4)', transition: 'color 200ms ease', userSelect: 'none', whiteSpace: 'nowrap' }}>{tab}</span>
                        <div style={{ position: 'absolute', bottom: '-0.5px', left: '50%', transform: 'translateX(-50%)', height: '2px', background: '#ffffff', borderRadius: '1px', width: isActive ? 'auto' : '0px', paddingLeft: isActive ? '0px' : '0px', paddingRight: isActive ? '0px' : '0px', opacity: isActive ? 1 : 0, transition: 'opacity 200ms ease' }}>
                          <span style={{ visibility: 'hidden', fontSize: '13px', fontWeight: 500, fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>{tab}</span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
            {leftPanelTab === 'History' ? (
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 16px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                {generationHistory.length > 0 && (
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 230,
                      fontSize: '10px',
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.45)',
                      fontFamily: "'Inter', sans-serif",
                      lineHeight: 1.4,
                    }}
                  >
                    {generationHistory.length} {generationHistory.length === 1 ? 'version' : 'versions'} · V1 = first generated · click to load
                  </div>
                )}
                {renderGenerationHistoryCards()}
              </div>
            ) : customActiveTab === 'Erase' && eraseLeftTab === 'Objects' ? (
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                  {/* Capture Area Action - only if not locked */}
                  {!captureLocked && (
                    <div
                      onClick={() => setSelectedAction(selectedAction === 'capture' ? null : 'capture')}
                      onMouseEnter={e => { if (selectedAction !== 'capture') (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.08)'; }}
                      onMouseLeave={e => { if (selectedAction !== 'capture') (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; }}
                      style={{ margin: '16px 16px 8px', display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 10, background: selectedAction === 'capture' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)', border: selectedAction === 'capture' ? '0.5px solid rgba(255,255,255,0.3)' : '0.5px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'background 150ms ease, border-color 150ms ease' }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 5V3.5C2 2.67 2.67 2 3.5 2H5" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 2H12.5C13.33 2 14 2.67 14 3.5V5" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 11V12.5C14 13.33 13.33 14 12.5 14H11" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 14H3.5C2.67 14 2 13.33 2 12.5V11" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><rect x="5" y="5" width="6" height="6" rx="0.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="2 1.5"/></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#ffffff', fontFamily: "'Inter', sans-serif" }}>Capture Area</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, fontFamily: "'Inter', sans-serif", marginTop: 2 }}>Draw a selection to define the area to erase.</div>
                      </div>
                    </div>
                  )}
                  {isCustomComponentConfiguration && (
                    <div
                      onClick={() => setSelectedAction(selectedAction === 'erase-full-components' ? null : 'erase-full-components')}
                      onMouseEnter={e => { if (selectedAction !== 'erase-full-components') (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.08)'; }}
                      onMouseLeave={e => { if (selectedAction !== 'erase-full-components') (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; }}
                      style={{ margin: '8px 16px 8px', display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 10, background: selectedAction === 'erase-full-components' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)', border: selectedAction === 'erase-full-components' ? '0.5px solid rgba(255,255,255,0.3)' : '0.5px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'background 150ms ease, border-color 150ms ease' }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2.7 3.3h10.6M4.2 3.3V2h7.6v1.3M5.3 3.3v9.2M8 3.3v9.2M10.7 3.3v9.2M3.4 3.3l.6 10.2h8l.6-10.2" stroke="rgba(255,255,255,0.55)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#ffffff', fontFamily: "'Inter', sans-serif" }}>Erase Full Components</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, fontFamily: "'Inter', sans-serif", marginTop: 2 }}>Removes all furniture components in the room (sofas, mats, curtains, decor, etc.) while keeping the room structure.</div>
                      </div>
                    </div>
                  )}

                  {captureLocked && captureThumb && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 16px', marginTop: 8 }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', width: '100%', textAlign: 'left', padding: '12px 0 6px 0' }}>Selected area</div>
                      <div style={{ width: 130, height: 130, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.15)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={captureThumb} alt="Selected area preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      {capturePixelDims && (
                        <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 8, fontFamily: "'Inter', sans-serif" }}>
                          {capturePixelDims.w} × {capturePixelDims.h} px
                        </div>
                      )}
                    </div>
                  )}
                  {captureLocked && !captureThumb && (
                    <div style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: "'Inter', sans-serif", lineHeight: 1.45 }}>
                      Preview unavailable for this image source; the selection on the main image is still used for erase.
                    </div>
                  )}
                </div>
                <div
                  style={{
                    flexShrink: 0,
                    padding: '12px 16px 14px',
                    borderTop: '0.5px solid rgba(255,255,255,0.1)',
                    background: 'linear-gradient(180deg, rgba(18,18,20,0.4) 0%, rgba(8,8,10,0.92) 100%)',
                  }}
                >
                  {(() => {
                    if (!canApplyErase && !(apiGenerating && apiGenerateKind === 'erase')) {
                      let hint = '';
                      if (externalGeneratePending) {
                        hint = 'Wait until the room image finishes loading.';
                      } else if (isCustomComponentConfiguration && selectedAction === 'erase-full-components') {
                        hint = '';
                      } else if (!captureLocked) {
                        hint = isCustomComponentConfiguration
                          ? 'Choose Capture Area, draw on the photo, confirm the box—or pick Erase Full Components—then Apply.'
                          : 'Choose Capture Area, draw on the photo, then lock the selection before applying.';
                      } else if (apiGenerating && apiGenerateKind !== 'erase') {
                        hint = 'Wait until the current edit finishes.';
                      }
                      return hint ? (
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45, marginBottom: 10, fontFamily: "'Inter', sans-serif" }}>
                          {hint}
                        </div>
                      ) : null;
                    }
                    return null;
                  })()}
                  <button
                    type="button"
                    disabled={!canApplyErase}
                    onClick={() => void handleEraseApply()}
                    style={{
                      width: '100%',
                      height: 42,
                      borderRadius: 8,
                      background: '#000000',
                      border: '1.5px solid #FFFFFF',
                      color: '#ffffff',
                      fontSize: 13,
                      fontWeight: 500,
                      fontFamily: "'Inter', sans-serif",
                      cursor: !canApplyErase ? 'not-allowed' : 'pointer',
                      opacity: !canApplyErase ? 0.5 : 1,
                      boxShadow: '0 2px 12px rgba(0,0,0,0.22)',
                    }}
                    onMouseEnter={e => {
                      if (!canApplyErase) return;
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = '#000000';
                    }}
                  >
                    {apiGenerating && apiGenerateKind === 'erase'
                      ? 'Erasing…'
                      : selectedAction === 'erase-full-components'
                        ? 'Apply full component erase'
                        : 'Apply erase'}
                  </button>
                </div>
              </div>
            ) : customActiveTab === 'Edit' ? (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {sceneDetectLoading && (
                  <div style={{ padding: '10px 16px', fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontFamily: "'Inter', sans-serif" }}>
                    Scanning room image for categories…
                  </div>
                )}
                {objectCategoryList.map((cat) => {
                  const isSel = selectedCategory === cat;
                  const thumb = OBJECT_CATEGORY_THUMB_URLS[cat] ?? OBJECT_CATEGORY_THUMB_URLS.Wall;
                  return (
                    <div
                      key={cat}
                      onClick={() => {
                        const nextCat = normalizeCategoryKey(cat);
                        setSelectedCategory(isSel ? null : nextCat);
                        if (!isSel) {
                          setCustomPanelTab('Colour');
                          if (isMobile) {
                            // Mobile Edit flow: selecting a category opens related data on right panel.
                            setMobileHistoryOpen(false);
                            setMobileRightPanelOpen(true);
                          }
                        }
                      }}
                      style={{ height: '56px', display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: '13px', fontFamily: "'Inter', sans-serif", color: isSel ? '#ffffff' : 'rgba(255,255,255,0.75)', background: isSel ? 'rgba(255,255,255,0.08)' : 'transparent', borderBottom: '0.5px solid rgba(255,255,255,0.06)', cursor: 'pointer', position: 'relative', transition: 'background 150ms ease, color 150ms ease', flexShrink: 0 }}
                      onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)'; }}
                      onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                    >
                      {isSel && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: '#ffffff' }} />}
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.08)', flexShrink: 0, overflow: 'hidden' }}>
                        <img src={thumb} alt={cat} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </div>
                      <span style={{ marginLeft: 12 }}>{cat}</span>
                    </div>
                  );
                })}
              </div>
            ) : customActiveTab === 'Add Object' ? (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {!isMobile && (
                  <div
                    onClick={() => setSelectedAction(selectedAction === 'capture' ? null : 'capture')}
                    onMouseEnter={e => { if (selectedAction !== 'capture') (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.08)'; }}
                    onMouseLeave={e => { if (selectedAction !== 'capture') (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; }}
                    style={{ margin: '16px 16px 8px', display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 10, background: selectedAction === 'capture' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)', border: selectedAction === 'capture' ? '0.5px solid rgba(255,255,255,0.3)' : '0.5px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'background 150ms ease, border-color 150ms ease' }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 5V3.5C2 2.67 2.67 2 3.5 2H5" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 2H12.5C13.33 2 14 2.67 14 3.5V5" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 11V12.5C14 13.33 13.33 14 12.5 14H11" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 14H3.5C2.67 14 2 13.33 2 12.5V11" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><rect x="5" y="5" width="6" height="6" rx="0.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="2 1.5"/></svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#ffffff', fontFamily: "'Inter', sans-serif" }}>Capture Area</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, fontFamily: "'Inter', sans-serif", marginTop: 2 }}>Step 1: draw a box on the image where the new object should appear.</div>
                    </div>
                  </div>
                )}
                {captureLocked && captureThumb && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 16px', marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', width: '100%', textAlign: 'left', padding: '0 0 6px 0' }}>Selected Area</div>
                    <div style={{ width: 130, height: 130, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.15)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={captureThumb} alt="Selected area" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    {capturePixelDims && (
                      <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 8, fontFamily: "'Inter', sans-serif" }}>
                        {capturePixelDims.w} × {capturePixelDims.h} px
                      </div>
                    )}
                  </div>
                )}
                {sceneDetectLoading && (
                  <div style={{ padding: '10px 16px', fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontFamily: "'Inter', sans-serif" }}>
                    Scanning room image for categories…
                  </div>
                )}
                {objectCategoryList.map((cat) => {
                  const isSel = addSelectedCategory === cat;
                  const thumb = OBJECT_CATEGORY_THUMB_URLS[cat] ?? OBJECT_CATEGORY_THUMB_URLS.Wall;
                  return (
                    <div
                      key={cat}
                      onClick={() => {
                        const nextCat = normalizeCategoryKey(cat);
                        setAddSelectedCategory(isSel ? null : nextCat);
                        if (!isSel) {
                          setAddPanelTab('Style');
                          if (isMobile) {
                            // Mobile Add flow: selecting a category should immediately open the right data panel.
                            setMobileHistoryOpen(false);
                            setMobileRightPanelOpen(true);
                          }
                        }
                      }}
                      style={{ height: '56px', display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: '13px', fontFamily: "'Inter', sans-serif", color: isSel ? '#ffffff' : 'rgba(255,255,255,0.75)', background: isSel ? 'rgba(255,255,255,0.08)' : 'transparent', borderBottom: '0.5px solid rgba(255,255,255,0.06)', cursor: 'pointer', position: 'relative', transition: 'background 150ms ease, color 150ms ease', flexShrink: 0 }}
                      onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)'; }}
                      onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                    >
                      {isSel && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: '#ffffff' }} />}
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.08)', flexShrink: 0, overflow: 'hidden' }}>
                        <img src={thumb} alt={cat} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </div>
                      <span style={{ marginLeft: 12 }}>{cat}</span>
                    </div>
                  );
                })}
              </div>
            ) : customActiveTab === 'Replace' ? (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {!isMobile && (
                  <div
                    onClick={() => setSelectedAction(selectedAction === 'capture' ? null : 'capture')}
                    onMouseEnter={e => { if (selectedAction !== 'capture') (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.08)'; }}
                    onMouseLeave={e => { if (selectedAction !== 'capture') (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; }}
                    style={{ margin: '16px 16px 8px', display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 10, background: selectedAction === 'capture' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)', border: selectedAction === 'capture' ? '0.5px solid rgba(255,255,255,0.3)' : '0.5px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'background 150ms ease, border-color 150ms ease' }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 5V3.5C2 2.67 2.67 2 3.5 2H5" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 2H12.5C13.33 2 14 2.67 14 3.5V5" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 11V12.5C14 13.33 13.33 14 12.5 14H11" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 14H3.5C2.67 14 2 13.33 2 12.5V11" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><rect x="5" y="5" width="6" height="6" rx="0.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="2 1.5"/></svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#ffffff', fontFamily: "'Inter', sans-serif" }}>Capture Area</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, fontFamily: "'Inter', sans-serif", marginTop: 2 }}>Step 1: draw a box on the image around what you want to replace.</div>
                    </div>
                  </div>
                )}
                {captureLocked && captureThumb && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 16px', marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', width: '100%', textAlign: 'left', padding: '0 0 6px 0' }}>Selected Area</div>
                    <div style={{ width: 130, height: 130, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.15)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={captureThumb} alt="Selected area" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    {capturePixelDims && (
                      <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 8, fontFamily: "'Inter', sans-serif" }}>
                        {capturePixelDims.w} × {capturePixelDims.h} px
                      </div>
                    )}
                  </div>
                )}
                {sceneDetectLoading && (
                  <div style={{ padding: '10px 16px', fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontFamily: "'Inter', sans-serif" }}>
                    Scanning room image for categories…
                  </div>
                )}
                {objectCategoryList.map((cat) => {
                  const isSel = replaceSelectedCategory === cat;
                  const thumb = OBJECT_CATEGORY_THUMB_URLS[cat] ?? OBJECT_CATEGORY_THUMB_URLS.Wall;
                  return (
                    <div
                      key={cat}
                      onClick={() => {
                        const nextCat = normalizeCategoryKey(cat);
                        setReplaceSelectedCategory(isSel ? null : nextCat);
                        if (!isSel) {
                          setReplacePanelTab('Style');
                          if (isMobile) {
                            // Mobile Replace flow: selecting a category should immediately open the right data panel.
                            setMobileHistoryOpen(false);
                            setMobileRightPanelOpen(true);
                          }
                        }
                      }}
                      style={{ height: '56px', display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: '13px', fontFamily: "'Inter', sans-serif", color: isSel ? '#ffffff' : 'rgba(255,255,255,0.75)', background: isSel ? 'rgba(255,255,255,0.08)' : 'transparent', borderBottom: '0.5px solid rgba(255,255,255,0.06)', cursor: 'pointer', position: 'relative', transition: 'background 150ms ease, color 150ms ease', flexShrink: 0 }}
                      onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)'; }}
                      onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                    >
                      {isSel && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: '#ffffff' }} />}
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.08)', flexShrink: 0, overflow: 'hidden' }}>
                        <img src={thumb} alt={cat} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </div>
                      <span style={{ marginLeft: 12 }}>{cat}</span>
                    </div>
                  );
                })}
              </div>
            ) : customActiveTab === 'Erase' && eraseLeftTab !== 'History' ? (
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {([
                  { id: 'capture', title: 'Capture Area', desc: 'Draw a selection to define the area you want to erase from the image.', icon: (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 5V3.5C2 2.67 2.67 2 3.5 2H5" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 2H12.5C13.33 2 14 2.67 14 3.5V5" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 11V12.5C14 13.33 13.33 14 12.5 14H11" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 14H3.5C2.67 14 2 13.33 2 12.5V11" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><rect x="5" y="5" width="6" height="6" rx="0.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="2 1.5"/></svg>
                  )},
                  ...(isCustomComponentConfiguration
                    ? [{
                        id: 'erase-full-components',
                        title: 'Erase Full Components',
                        desc: 'Removes all room furniture components while preserving structure and layout.',
                        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2.7 3.3h10.6M4.2 3.3V2h7.6v1.3M5.3 3.3v9.2M8 3.3v9.2M10.7 3.3v9.2M3.4 3.3l.6 10.2h8l.6-10.2" stroke="rgba(255,255,255,0.55)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>,
                      }]
                    : []),
                ] as { id: string; title: string; desc: string; icon: React.ReactNode }[]).map(item => {
                  const isActive = selectedAction === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedAction(isActive ? null : item.id)}
                      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.08)'; }}
                      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; }}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 10, background: isActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)', border: isActive ? '0.5px solid rgba(255,255,255,0.3)' : '0.5px solid rgba(255,255,255,0.08)', cursor: 'pointer', transition: 'background 150ms ease, border-color 150ms ease' }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#ffffff', fontFamily: "'Inter', sans-serif" }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, fontFamily: "'Inter', sans-serif", marginTop: 2 }}>{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ flex: 1 }} />
            )}
          </>
        ) : historyRailCollapsed ? (
          <button
            type="button"
            aria-label="Show history"
            aria-expanded={false}
            disabled={generationHistory.length === 0}
            onClick={() => generationHistory.length > 0 && setShowHistoryPanel(true)}
            style={{
              flex: 1,
              width: '100%',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingTop: '16px',
              gap: '10px',
              background: 'transparent',
              border: 'none',
              cursor: generationHistory.length === 0 ? 'default' : 'pointer',
              color: generationHistory.length === 0 ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.75)',
              opacity: generationHistory.length === 0 ? 0.65 : 1,
            }}
          >
            <IconHistoryMenu />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.06em',
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                textTransform: 'uppercase',
                userSelect: 'none',
              }}
            >
              History
            </span>
          </button>
        ) : (
          <>
            <div
              style={{
                padding: '16px 14px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 300, color: 'rgba(255,255,255,0.92)' }}>History</span>
                {generationHistory.length > 0 && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.75)',
                      background: 'rgba(255,255,255,0.10)',
                      padding: '3px 8px',
                      borderRadius: '999px',
                      fontFamily: "'Inter', sans-serif",
                      flexShrink: 0,
                    }}
                  >
                    {generationHistory.length} {generationHistory.length === 1 ? 'version' : 'versions'}
                  </span>
                )}
              </div>
              <button
                type="button"
                aria-label="Hide history"
                onClick={() => setShowHistoryPanel(false)}
                style={{
                  flexShrink: 0,
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.85)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 150ms ease',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 16px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              {generationHistory.length > 0 && (
                <div
                  style={{
                    width: '100%',
                    maxWidth: 230,
                    fontSize: '10px',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.45)',
                    fontFamily: "'Inter', sans-serif",
                    lineHeight: 1.4,
                  }}
                >
                  V1 = first generated · click a version to load it (same as room configuration).
                </div>
              )}
              {renderGenerationHistoryCards()}
            </div>
          </>
        )}
      </div>

      {/* ── CENTER: Generated Image + Toolbar ───────────────────────────── */}
      <div
        style={{
          flex:                 1,
          minWidth:             0,
          height:               '100%',
          background:           'rgba(0,0,0,0.22)',
          borderRadius:         '12px',
          border:               '1px solid rgba(255,255,255,0.08)',
          boxShadow:            '0px 8px 32px 0px rgba(0,0,0,0.4)',
          display:              'flex',
          flexDirection:        'column',
          overflow:             isCustomisation ? 'visible' : 'hidden',
          backdropFilter:       'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          position:             'relative',
        }}
        >
        {/* Toolbar */}
        <div
          style={{
            height:        isMobile ? '46px' : '39px',
            flexShrink:    0,
            background:    'rgba(0,0,0,0.22)',
            borderBottom:  '1px solid rgba(255,255,255,0.15)',
            display:       'flex',
            alignItems:    'center',
            paddingLeft:   isMobile ? '8px' : '1px',
            paddingRight:  isMobile ? '8px' : undefined,
            position:      'relative',
            overflowX:     isMobile ? 'auto' : 'visible',
            overflowY:     'hidden',
            scrollbarWidth:'none',
          }}
        >
          {!isMobile && (
            <>
              <ToolbarButton
                icon={<IconShare />}
                label="Share"
                onClick={handleShareCurrentResult}
                disabled={!afterImage}
              />
              <ToolbarDivider />
              <ToolbarButton
                icon={<IconLike active={liked} />}
                label={liked ? "Liked" : "Like"}
                onClick={handleToggleLike}
                disabled={!afterImage}
                active={liked}
              />
              <ToolbarDivider />
              <ToolbarButton
                icon={<IconDownload />}
                label="Download"
                onClick={handleDownloadCurrentResult}
                disabled={!afterImage}
              />
              <ToolbarDivider />
            </>
          )}
          <ToolbarButton
            icon={<span style={{ color: '#ffffff', display: 'inline-flex' }}><CustomTabIconUndo /></span>}
            label="Undo"
            onClick={() => onUndo?.()}
            disabled={!canUndo}
            iconOnly
          />
          {!isMobile && <ToolbarDivider />}
          <ToolbarButton
            icon={<span style={{ color: '#ffffff', display: 'inline-flex' }}><CustomTabIconRedo /></span>}
            label="Redo"
            onClick={() => onRedo?.()}
            disabled={!canRedo}
            iconOnly
          />
          {!isMobile && <ToolbarDivider />}
          <ToolbarButton
            icon={<span style={{ color: '#ffffff', display: 'inline-flex' }}><CustomTabIconRestart /></span>}
            label="Restart"
            onClick={() => onRestart?.()}
            disabled={!afterImage}
            iconOnly
          />
          {!isMobile && <ToolbarDivider />}
          <ToolbarButton
            icon={<IconWatermark />}
            label={showWatermark ? 'Remove watermark' : 'Show watermark'}
            onClick={() => setShowWatermark((v) => !v)}
            disabled={!generatedImageUrl?.trim() || !generatedImageRawUrl?.trim()}
            active={!showWatermark}
            iconOnly={isMobile}
          />

          <div style={{ marginLeft: 'auto', display: isMobile ? 'flex' : 'none', alignItems: 'center' }}>
            {!isMobile && <ToolbarDivider />}
            {/* Share */}
            <ToolbarButton
              icon={<IconShare />}
              label="Share"
              onClick={handleShareCurrentResult}
              disabled={!afterImage}
              iconOnly={isMobile}
            />
            {!isMobile && <ToolbarDivider />}
            {/* Like */}
            <ToolbarButton
              icon={<IconLike active={liked} />}
              label={liked ? "Liked" : "Like"}
              onClick={handleToggleLike}
              disabled={!afterImage}
              active={liked}
              iconOnly={isMobile}
            />
            {!isMobile && <ToolbarDivider />}
            {/* Download */}
            <ToolbarButton
              icon={<IconDownload />}
              label="Download"
              onClick={handleDownloadCurrentResult}
              disabled={!afterImage}
              iconOnly={isMobile}
            />
          </div>
          {!showEditSwitchers && !isMobile && (
            <>
          {!isMobile && <ToolbarDivider />}
              <ToolbarButton
                icon={<IconHistoryMenu />}
                label="History"
                active={showHistoryPanel}
                onClick={() => setShowHistoryPanel((open) => !open)}
                disabled={generationHistory.length === 0}
              />
            </>
          )}

          {/* Style badge + color dots */}
          <div
            style={{
              display:      isMobile ? 'none' : 'flex',
              position:     isMobile ? 'static' : 'absolute',
              right:        '10px',
              top:          '50%',
              transform:    isMobile ? 'none' : 'translateY(-50%)',
              alignItems:   'center',
              gap:          '8px',
              marginLeft:   'auto',
              paddingRight: isMobile ? '8px' : undefined,
              flexShrink:   0,
              pointerEvents:'auto',
              opacity:      1,
            }}
          >
            <div
              style={{
                background:   'rgba(0,0,0,0.65)',
                border:       '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                padding:      '4px 10px',
                fontSize:     '11px',
                fontWeight:   300,
                color:        'rgba(255,255,255,0.95)',
                fontFamily:   "'Inter', sans-serif",
                whiteSpace:   'nowrap',
                transition:   'all 180ms ease',
              }}
            >
              {selectedStyle}
            </div>
            {selectedColorDots && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {selectedColorDots.map((color, i) => (
                  <div
                    key={i}
                    style={{
                      width:        '7px',
                      height:       '7px',
                      borderRadius: '50%',
                      background:   color,
                      flexShrink:   0,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {isCustomisation && isMobile && (
          <div
            style={{
              flexShrink: 0,
              padding: isMobile ? '8px 8px 10px' : '8px 12px 10px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(0,0,0,0.2)',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <CustomisationTabBar
              activeTab={customActiveTab}
              onTabChange={onCustomTabChange}
            />
          </div>
        )}

        {isMobile && (
          <div
            style={{
              minHeight: '42px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 8px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(0,0,0,0.24)',
            }}
          >
            {!isMobileDirectCaptureFlow ? (
              <button
                type="button"
                onClick={() => {
                  setMobileHistoryOpen((v) => !v);
                  if (!mobileHistoryOpen) setMobileRightPanelOpen(false);
                }}
                style={{
                  height: '30px',
                  padding: '0 10px',
                  borderRadius: '9px',
                  border: `1px solid ${mobileHistoryOpen ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)'}`,
                  background: mobileHistoryOpen ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.55)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 500,
                  fontFamily: "'Inter', sans-serif",
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                History
              </button>
            ) : (
              <div
                style={{
                  height: '30px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0 10px',
                  borderRadius: '9px',
                  border: '1px solid rgba(255,255,255,0.22)',
                  background: 'rgba(0,0,0,0.55)',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '11px',
                  fontWeight: 500,
                  fontFamily: "'Inter', sans-serif",
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                Capture Area Mode
              </div>
            )}
            <div
              style={{
                background:   'rgba(0,0,0,0.55)',
                border:       '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                padding:      '3px 8px',
                fontSize:     '10px',
                fontWeight:   400,
                color:        'rgba(255,255,255,0.95)',
                fontFamily:   "'Inter', sans-serif",
                whiteSpace:   'nowrap',
                maxWidth:     '38%',
                overflow:     'hidden',
                textOverflow: 'ellipsis',
                flexShrink:   1,
              }}
              title={selectedStyle}
            >
              {selectedStyle}
            </div>
            {selectedColorDots && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto', flexShrink: 0 }}>
                {selectedColorDots.slice(0, 6).map((color, i) => (
                  <div
                    key={i}
                    style={{
                      width:        '7px',
                      height:       '7px',
                      borderRadius: '50%',
                      background:   color,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Generated Image */}
        <div
          ref={imagePanelRef}
          onMouseDown={handleCaptureMouseDown}
          onMouseMove={handleCaptureMouseMove}
          onMouseUp={handleCaptureMouseUp}
          onMouseLeave={handleCaptureMouseUp}
          onTouchStart={handleCaptureTouchStart}
          onTouchMove={handleCaptureTouchMove}
          onTouchEnd={handleCaptureMouseUp}
          onTouchCancel={handleCaptureMouseUp}
          style={{
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
            position: 'relative',
            cursor: captureMode ? 'crosshair' : isDragging ? 'ew-resize' : undefined,
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            userSelect: captureMode ? 'none' : undefined,
            background: '#0d0d0d',
            touchAction: captureMode ? 'none' : 'auto',
          }}
        >
          {/* AFTER image (full, always visible as base layer) — contain preserves upload aspect ratio (no crop). */}
          <img
            ref={afterImageRef}
            src={afterImage}
            alt="Generated Room"
            onLoad={measureRenderedImageOffset}
            style={{
              width:          '100%',
              height:         '100%',
              objectFit:      'contain',
              objectPosition: isMobile ? `center ${MOBILE_IMAGE_Y_ANCHOR * 100}%` : 'center center',
              display:        'block',
            }}
          />
          {/* BEFORE image (clipped to left of divider) — only when compare is active */}
          {showCompare && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                clipPath: `inset(0 ${100 - dividerPos}% 0 0)`,
              }}
            >
              <img
                src={beforeImage}
                alt="Original Room"
                style={{
                  width:          '100%',
                  height:         '100%',
                  objectFit:      'contain',
                  objectPosition: isMobile ? `center ${MOBILE_IMAGE_Y_ANCHOR * 100}%` : 'center center',
                  display:        'block',
                }}
              />
            </div>
          )}

          {/* Divider line + handle */}
          {showCompare && (
            <>
              {/* Vertical divider line */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${dividerPos}%`,
                  width: '0.5px',
                  background: 'rgba(255,255,255,0.25)',
                  transform: 'translateX(-0.25px)',
                  pointerEvents: 'none',
                  zIndex: 2,
                }}
              />
              {/* Drag handle */}
              <div
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${dividerPos}%`,
                  transform: 'translate(-50%, -50%)',
                  width: isMobile ? '44px' : '32px',
                  height: isMobile ? '44px' : '32px',
                  borderRadius: '50%',
                  background: 'rgba(20,20,20,0.85)',
                  border: '1.5px solid #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'ew-resize',
                  zIndex: 3,
                  userSelect: 'none',
                  touchAction: 'none',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M4.5 3L1.5 7L4.5 11" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9.5 3L12.5 7L9.5 11" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </>
          )}

          {/* BEFORE label */}
          {showCompare && (
            <div
              style={{
                position: 'absolute',
                top: `${renderedImageOffset.y + 8}px`,
                left: `${renderedImageOffset.x + 8}px`,
                background: 'rgba(0,0,0,0.7)',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: '5px',
                fontFamily: "'Inter', sans-serif",
                pointerEvents: 'none',
                opacity: labelsOpacity,
                zIndex: 4,
              }}
            >
              BEFORE
            </div>
          )}

          {/* AFTER label */}
          {showCompare && (
            <div
              style={{
                position: 'absolute',
                top: `${renderedImageOffset.y + 8}px`,
                right: `${renderedImageOffset.x + 8}px`,
                background: 'rgba(0,0,0,0.7)',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: '5px',
                fontFamily: "'Inter', sans-serif",
                pointerEvents: 'none',
                opacity: labelsOpacity,
                zIndex: 4,
              }}
            >
              AFTER
            </div>
          )}

          {showScanCanvas && !captureMode && (
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                left: `${renderedImageOffset.x}px`,
                top: `${renderedImageOffset.y}px`,
                width: `${Math.max(0, renderedImageSize.w)}px`,
                height: `${Math.max(0, renderedImageSize.h)}px`,
                pointerEvents: 'none',
                zIndex: 90,
              }}
            />
          )}

          {/* Capture area overlay */}
          {captureMode && (
            <>
              <style>{`
                @keyframes captureWetDriftA {
                  0% { transform: translate3d(0, 0, 0) scale(1.03); }
                  50% { transform: translate3d(-6%, 4%, 0) scale(1.09); }
                  100% { transform: translate3d(5%, -4%, 0) scale(1.06); }
                }
                @keyframes captureWetDriftB {
                  0% { transform: translate3d(0, 0, 0) scale(1.05); }
                  50% { transform: translate3d(4%, -6%, 0) scale(1.12); }
                  100% { transform: translate3d(-4%, 4%, 0) scale(1.08); }
                }
                @keyframes captureShimmerSweep {
                  0% { transform: translateX(-135%); opacity: 0.18; }
                  50% { opacity: 0.42; }
                  100% { transform: translateX(135%); opacity: 0.18; }
                }
              `}</style>
              {/* Dark overlay with cutout via clip-path */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: isMobileDirectCaptureFlow ? 'rgba(0,0,0,0.16)' : 'rgba(0,0,0,0.35)',
                  pointerEvents: 'none',
                  zIndex: 5,
                  ...(captureRect && captureRect.w > 0.5 && captureRect.h > 0.5 ? {
                    clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${captureRect.x}% ${captureRect.y}%, ${captureRect.x}% ${captureRect.y + captureRect.h}%, ${captureRect.x + captureRect.w}% ${captureRect.y + captureRect.h}%, ${captureRect.x + captureRect.w}% ${captureRect.y}%, ${captureRect.x}% ${captureRect.y}%)`,
                  } : {}),
                }}
              />
              {isMobileDirectCaptureFlow && !captureLocked && (
                <div
                  style={{
                    position: 'absolute',
                    top: 14,
                    left: 14,
                    right: 14,
                    zIndex: 9,
                    pointerEvents: 'none',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      maxWidth: 290,
                      width: '100%',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.22)',
                      background: 'rgba(0,0,0,0.62)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
                      padding: '10px 12px',
                      color: '#ffffff',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600 }}>Capture Area</div>
                    <div style={{ fontSize: 11, marginTop: 3, color: 'rgba(255,255,255,0.78)', lineHeight: 1.35 }}>
                      Draw a box directly on the image to select the region.
                    </div>
                  </div>
                </div>
              )}
              {/* Selection rectangle border */}
              {captureRect && captureRect.w > 0.5 && captureRect.h > 0.5 && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${captureRect.x}%`,
                    top: `${captureRect.y}%`,
                    width: `${captureRect.w}%`,
                    height: `${captureRect.h}%`,
                    border: captureLocked ? '1px solid rgba(255,255,255,0.9)' : '1.5px dashed rgba(255,255,255,0.9)',
                    pointerEvents: 'none',
                    zIndex: 6,
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    background: captureLocked ? 'rgba(150, 168, 184, 0.20)' : 'transparent',
                  }}
                >
                  {captureLocked && showSelectedAreaEffect && (
                    <>
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          // Frosted base that bends the image beneath (rain-on-glass look).
                          backdropFilter: 'blur(5px) contrast(1.15) saturate(0.82)',
                          WebkitBackdropFilter: 'blur(5px) contrast(1.15) saturate(0.82)',
                          background:
                            'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(210,220,230,0.12) 52%, rgba(120,130,145,0.2) 100%)',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          inset: '-12%',
                          background:
                            'radial-gradient(120px 90px at 20% 20%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.05) 55%, transparent 80%), radial-gradient(140px 110px at 72% 30%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.04) 58%, transparent 82%), radial-gradient(110px 80px at 45% 78%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.03) 60%, transparent 84%)',
                          filter: 'blur(3.2px)',
                          animation: 'captureWetDriftA 1.75s ease-in-out infinite alternate',
                          opacity: 1,
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          inset: '-14%',
                          background:
                            'repeating-linear-gradient(103deg, rgba(255,255,255,0.14) 0 2px, rgba(255,255,255,0.0) 2px 14px), repeating-linear-gradient(77deg, rgba(255,255,255,0.08) 0 1px, rgba(255,255,255,0.0) 1px 10px)',
                          mixBlendMode: 'screen',
                          filter: 'blur(2.2px)',
                          animation: 'captureWetDriftB 2.05s ease-in-out infinite',
                          opacity: 0.62,
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          width: '46%',
                          background:
                            'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.30) 48%, rgba(255,255,255,0) 100%)',
                          filter: 'blur(1.6px)',
                          animation: 'captureShimmerSweep 1.7s ease-in-out infinite',
                        }}
                      />
                    </>
                  )}
                </div>
              )}
              {/* Corner handles when locked */}
              {captureLocked && captureRect && (() => {
                const r = captureRect;
                const corners = [
                  { cx: r.x, cy: r.y },
                  { cx: r.x + r.w, cy: r.y },
                  { cx: r.x, cy: r.y + r.h },
                  { cx: r.x + r.w, cy: r.y + r.h },
                ];
                return corners.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: `${c.cx}%`,
                      top: `${c.cy}%`,
                      width: 6,
                      height: 6,
                      background: '#ffffff',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 7,
                      pointerEvents: 'none',
                    }}
                  />
                ));
              })()}
              {/* Contextual erase action attached to selected bbox */}
              {customActiveTab === 'Erase' &&
                eraseLeftTab === 'Objects' &&
                (captureLocked || (isCustomComponentConfiguration && selectedAction === 'erase-full-components')) && (
                <button
                  type="button"
                  disabled={!canApplyErase}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleEraseApply();
                  }}
                  style={{
                    position: 'absolute',
                    left: captureRect ? `${captureRect.x + captureRect.w}%` : '50%',
                    top: captureRect ? `${captureRect.y + captureRect.h}%` : '50%',
                    transform: 'translate(-100%, 10px)',
                    minWidth: '130px',
                    height: '34px',
                    padding: '0 12px',
                    background: '#000000',
                    border: '1px solid #ffffff',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 500,
                    fontFamily: "'Inter', sans-serif",
                    letterSpacing: '-0.1px',
                    cursor: !canApplyErase ? 'not-allowed' : 'pointer',
                    boxShadow: '0px 2px 12px 0px rgba(0,0,0,0.30)',
                    transition: 'background 150ms ease',
                    opacity: !canApplyErase ? 0.55 : 1,
                    zIndex: 8,
                    pointerEvents: 'auto',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => {
                    if (!canApplyErase) return;
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#000000';
                  }}
                >
                  {apiGenerating && apiGenerateKind === 'erase'
                    ? 'Erasing…'
                    : selectedAction === 'erase-full-components'
                      ? 'Apply full component erase'
                      : 'Apply erase'}
                </button>
              )}
            </>
          )}

          {/* Placing component dot grid overlay */}
          {placingComponent && (() => {
            const panel = imagePanelRef.current;
            const pw = panel ? panel.offsetWidth : 600;
            const ph = panel ? panel.offsetHeight : 400;
            const CELL = 28;
            const cols = Math.ceil(pw / CELL);
            const rows = Math.ceil(ph / CELL);
            const totalDots = cols * rows;

            return (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 100, margin: 0, padding: 0, opacity: placingPhase === 'fadeout' ? 0 : 1, transition: placingPhase === 'fadeout' ? 'opacity 400ms ease' : 'opacity 300ms ease', pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', padding: 0, margin: 0, overflow: 'hidden', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 28px)', gridTemplateRows: 'repeat(auto-fill, 28px)', background: '#000000', zIndex: 100 }}>
                  {Array.from({ length: totalDots }, (_, i) => {
                    const col = i % cols;
                    const row = Math.floor(i / cols);
                    return (
                      <div key={i} style={{ width: 8, height: 8, borderRadius: 3, placeSelf: 'center', animation: 'dotPulse 1200ms ease-in-out infinite both', animationDelay: `${(col + row) * 80}ms` } as React.CSSProperties} />
                    );
                  })}
                </div>
                <div style={{ position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)', zIndex: 101, background: 'rgba(0,0,0,0.6)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '6px 16px', color: '#ffffff', fontSize: 12, fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>
                  Placing component...
                </div>
              </div>
            );
          })()}

          {/* 360° room tour — compact FAB; full flow opens in modal (no panel below image) */}
          {canUseRoomTourVideo && (
            <button
              type="button"
              onClick={openTourVideoModal}
              title="Create 360° room tour video"
              style={{
                position: 'absolute',
                right: 14,
                bottom: isMobile && isCustomisation ? 84 : 14,
                zIndex: isMobile && isCustomisation ? 10001 : 48,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '0.45rem 0.85rem',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.35)',
                background: 'rgba(15,23,42,0.82)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: '#f8fafc',
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-hidden
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                  <rect x="2" y="6" width="14" height="12" rx="2" />
                </svg>
              </span>
              360° Video
            </button>
          )}
        </div>
        {!isMobile && isCustomisation && (
          <div style={{ position: 'absolute', bottom: '-36px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
            <CustomisationTabBar
              activeTab={customActiveTab}
              onTabChange={onCustomTabChange}
            />
          </div>
        )}
      </div>

      {/* ── RIGHT: Color / Style Panel ───────────────────────────────────── */}
      <div
        style={{
          width:                showRightPanel ? (isMobile ? '82vw' : '259px') : '0px',
          flexShrink:           0,
          // Mobile: do not set height: 100% with top+bottom — CSS ignores bottom when over-constrained,
          // so the panel was extending under the z-[60] tab bar and hid "Confirm Customisation".
          height:               isMobile ? undefined : '100%',
          minHeight:            isMobile ? 0 : undefined,
          background:           'rgba(0,0,0,0.22)',
          borderRadius:         '16px',
          border:               showRightPanel ? '1px solid rgba(255,255,255,0.08)' : '0px solid transparent',
          boxShadow:            showRightPanel ? '0px 8px 32px 0px rgba(0,0,0,0.4)' : 'none',
          display:              'flex',
          flexDirection:        'column',
          overflow:             'hidden',
          backdropFilter:       showRightPanel ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: showRightPanel ? 'blur(12px)' : 'none',
          opacity:              showRightPanel ? 1 : 0,
          transition:           'width 300ms ease, opacity 300ms ease, border 300ms ease, box-shadow 300ms ease',
          zIndex:               isMobile ? 56 : undefined,
          right:                isMobile ? '0px' : undefined,
          top:                  isMobile ? '0px' : undefined,
          bottom:               isMobile ? '74px' : undefined,
          position:             isMobile ? 'absolute' : 'relative',
        }}
      >
        {isMobile && showRightPanel && (
          <button
            type="button"
            onClick={() => setMobileRightPanelOpen(false)}
            aria-label="Close tools panel"
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 28,
              height: 28,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.16)',
              background: 'rgba(0,0,0,0.5)',
              color: 'rgba(255,255,255,0.9)',
              cursor: 'pointer',
              zIndex: 70,
            }}
          >
            ×
          </button>
        )}
        {isCustomisation && customActiveTab === 'Add Object' ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: "'Inter', sans-serif", position: 'relative' }}>
            {/* Uploaded Component panel */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'clip', background: 'rgba(0,0,0,0.22)', zIndex: 3, opacity: addObjectSubPanel === 'uploadedComponent' ? 1 : 0, transform: addObjectSubPanel === 'uploadedComponent' ? 'translateX(0)' : 'translateX(100%)', transition: 'opacity 250ms ease, transform 250ms ease', pointerEvents: addObjectSubPanel === 'uploadedComponent' ? 'auto' : 'none' }}>
              <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div onClick={() => { setAddObjectSubPanel(null); setConfirmedUploadImages([]); setUploadedImages([null, null, null]); setUploadedCompColour(null); }} style={{ width: 16, height: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#ffffff' }}>Uploaded Component</span>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingBottom: 8, scrollbarWidth: 'none' } as React.CSSProperties}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', padding: '12px 16px 8px' }}>Uploaded Images</div>
                <div style={{ padding: '0 16px', boxSizing: 'border-box' }}>
                  <div
                    onScroll={(e) => {
                      const el = e.currentTarget;
                      const itemW = el.clientWidth;
                      const idx = Math.round(el.scrollLeft / (itemW + 10));
                      setUploadedImgIdx(idx);
                    }}
                    style={{ display: 'flex', flexDirection: 'row', overflowX: 'auto', scrollSnapType: 'x mandatory', gap: 10, paddingBottom: 8, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollPaddingLeft: 0 } as React.CSSProperties}
                  >
                    {confirmedUploadImages.map((img, idx) => (
                      <div key={idx} style={{ flexShrink: 0, width: '100%', scrollSnapAlign: 'start' }}>
                        <img src={img} alt={`Image ${idx + 1}`} style={{ borderRadius: 10, height: 160, objectFit: 'cover', border: '0.5px solid rgba(255,255,255,0.1)', width: '100%', display: 'block' }} />
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 6, flexShrink: 0 }}>Image {idx + 1}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {confirmedUploadImages.length > 1 && (
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8 }}>
                    {confirmedUploadImages.map((_, idx) => (
                      <div key={idx} style={{ width: 5, height: 5, borderRadius: '50%', background: idx === uploadedImgIdx ? '#ffffff' : 'rgba(255,255,255,0.3)', transition: 'background 200ms ease' }} />
                    ))}
                  </div>
                )}
                {/* Details */}
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', padding: '14px 16px 6px' }}>Details</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, padding: '0 16px 16px' }}>
                  AI will place this component into the selected area using your uploaded reference images and chosen colour.
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '10px 16px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px 16px' }}>
                  {[
                    { label: 'Width', value: '82 cm' },
                    { label: 'Depth', value: '74 cm' },
                    { label: 'Height', value: '78 cm' },
                    { label: 'Weight', value: '12 kg' },
                    { label: 'Material', value: 'Fabric / Metal' },
                    { label: 'Fit for', value: 'Living Room' },
                  ].map((spec) => (
                    <div key={spec.label} style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{spec.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{spec.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Add to Image button — pinned at bottom, hidden until colour selected */}
              <div style={{ flexShrink: 0, padding: '8px 16px', display: 'block' }}>
                <button
                  type="button"
                  onClick={handlePlaceComponent}
                  disabled={placingComponent || apiGenerating || externalGeneratePending || !roomSession}
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: '#ffffff', fontSize: 13, fontWeight: 500, width: '100%', borderRadius: 8, height: 40, cursor: placingComponent || apiGenerating || externalGeneratePending || !roomSession ? 'default' : 'pointer', fontFamily: "'Inter', sans-serif", transition: 'background 150ms ease, opacity 150ms ease', opacity: placingComponent || apiGenerating || externalGeneratePending || !roomSession ? 0.4 : 1 }}
                  onMouseEnter={e => { if (!placingComponent && !apiGenerating && !externalGeneratePending && roomSession) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
                >
                  {apiGenerating && apiGenerateKind === 'add' ? 'Adding…' : 'Add to Image'}
                </button>
              </div>
            </div>
            {/* Generate with Text Prompt panel */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(0,0,0,0.22)', zIndex: 3, opacity: addObjectSubPanel === 'generatePrompt' ? 1 : 0, transform: addObjectSubPanel === 'generatePrompt' ? 'translateX(0)' : 'translateX(100%)', transition: 'opacity 250ms ease, transform 250ms ease', pointerEvents: addObjectSubPanel === 'generatePrompt' ? 'auto' : 'none' }}>
              <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div onClick={() => { setAddObjectSubPanel(null); setGeneratePromptText(''); setGeneratedPreview(false); setGeneratedPreviewUrl(null); setGenerating(false); setGenerateScanning(false); }} style={{ width: 16, height: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#ffffff' }}>Generate Component</div>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
              <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', padding: '12px 16px 6px' }}>Guidelines</div>
                {['Be specific about style, material and colour', 'Mention the room context e.g. living room', 'Include size hints e.g. large, compact', 'Avoid vague terms like nice or modern'].map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '0 16px', lineHeight: 1.8 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', flexShrink: 0, marginTop: 7 }} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{t}</span>
                  </div>
                ))}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 16px' }} />
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', padding: '12px 16px 6px' }}>Your Prompt</div>
                <textarea
                  ref={generateTextareaRef}
                  value={generatePromptText}
                  onChange={e => { if (e.target.value.length <= 300) setGeneratePromptText(e.target.value); }}
                  placeholder="e.g. A compact velvet armchair in deep emerald green with gold legs, mid-century style..."
                  style={{ width: 'calc(100% - 32px)', margin: '0 16px', minHeight: 100, background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 12, fontSize: 12, color: '#ffffff', resize: 'none', fontFamily: "'Inter', sans-serif", outline: 'none' }}
                />
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '4px 16px 0', textAlign: 'right' }}>{generatePromptText.length} / 300</div>
                {!generatedPreview && !generateScanning && generatePromptText.trim() && (
                  <div style={{ padding: '12px 16px 0' }}>
                    <button
                      type="button"
                      onClick={handlePlaceComponent}
                      disabled={placingComponent || apiGenerating || externalGeneratePending || !roomSession}
                      style={{ width: '100%', height: 40, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.35)', color: '#ffffff', fontSize: 13, fontWeight: 500, borderRadius: 8, cursor: placingComponent || apiGenerating || externalGeneratePending || !roomSession ? 'default' : 'pointer', fontFamily: "'Inter', sans-serif", transition: 'background 150ms ease, opacity 150ms ease', opacity: placingComponent || apiGenerating || externalGeneratePending || !roomSession ? 0.45 : 1 }}
                      onMouseEnter={e => { if (!placingComponent && !apiGenerating && !externalGeneratePending && roomSession) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.2)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)'; }}
                    >
                      {apiGenerating && apiGenerateKind === 'add' ? 'Adding…' : 'Add to Image (use prompt)'}
                    </button>
                  </div>
                )}
                {/* Scanning animation + Generated Preview */}
                {(generateScanning || generatedPreview) && (
                  <>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', padding: '12px 16px 4px' }}>Generated Preview</div>
                    <div style={{ width: 'calc(100% - 32px)', margin: '0 16px', aspectRatio: '1 / 1', borderRadius: 10, border: '0.5px solid rgba(255,255,255,0.1)', background: '#000', overflow: 'hidden', position: 'relative' }}>
                      {generateScanning ? (
                        <div style={{ position: 'absolute', inset: 0 }}>
                          <style>{`@keyframes genScanSweep { 0% { transform: translate(-100%, -100%) rotate(45deg); } 100% { transform: translate(100%, 100%) rotate(45deg); } }`}</style>
                          {Array.from({ length: 12 }).map((_, row) =>
                            Array.from({ length: 12 }).map((_, col) => (
                              <div key={`${row}-${col}`} style={{ position: 'absolute', left: `${(col / 12) * 100}%`, top: `${(row / 12) * 100}%`, width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
                            ))
                          )}
                          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', width: '200%', height: '40%', background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.12) 60%, transparent 100%)', animation: 'genScanSweep 1.5s ease-in-out forwards' }} />
                          </div>
                        </div>
                      ) : (
                        <img src={generatedPreviewUrl || ''} alt="Generated component" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      )}
                    </div>
                    {generatedPreview && (
                      <>
                        {/* Rewrite Prompt button below preview */}
                        <div style={{ padding: '8px 16px 4px' }}>
                          <button
                            onClick={() => {
                              setGeneratedPreview(false);
                              setGenerateScanning(false);
                              setGeneratedPreviewUrl(null);
                              setTimeout(() => generateTextareaRef.current?.focus(), 50);
                            }}
                            style={{ width: '100%', height: 40, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 500, borderRadius: 8, cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'background 150ms ease, color 150ms ease' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLButtonElement).style.color = '#ffffff'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.75)'; }}
                          >
                            Rewrite Prompt
                          </button>
                        </div>
                        {/* Add to Image button */}
                        <div style={{ padding: '4px 16px 16px' }}>
                          <button
                            type="button"
                            onClick={handlePlaceComponent}
                            disabled={placingComponent || apiGenerating || externalGeneratePending || !roomSession}
                            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: '#ffffff', fontSize: 13, fontWeight: 500, width: '100%', borderRadius: 8, height: 40, cursor: placingComponent || apiGenerating || externalGeneratePending || !roomSession ? 'default' : 'pointer', fontFamily: "'Inter', sans-serif", transition: 'background 150ms ease, opacity 150ms ease', opacity: placingComponent || apiGenerating || externalGeneratePending || !roomSession ? 0.4 : 1 }}
                            onMouseEnter={e => { if (!placingComponent && !apiGenerating && !externalGeneratePending && roomSession) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
                          >
                            {apiGenerating && apiGenerateKind === 'add' ? 'Adding…' : 'Add to Image'}
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
            {/* Add Object — same Style / Colour / Material flow as Edit (category chosen on the left) */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 1, display: 'flex', flexDirection: 'column', opacity: addObjectSubPanel === null ? 1 : 0, pointerEvents: addObjectSubPanel === null ? 'auto' : 'none', transition: 'opacity 250ms ease' }}>
              <div style={{ padding: '12px 16px 0', borderBottom: '0.5px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'row', flexShrink: 0 }}>
                {(['Style', 'Colour', 'Material'] as const).map((tab) => {
                  const isActive = addPanelTab === tab;
                  return (
                    <div
                      key={tab}
                      onClick={() => setAddPanelTab(tab)}
                      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', paddingBottom: '10px', position: 'relative' }}
                    >
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: isActive ? 500 : 400, color: isActive ? '#ffffff' : 'rgba(255,255,255,0.4)', transition: 'color 200ms ease', userSelect: 'none' }}>{tab}</span>
                      <div style={{ position: 'absolute', bottom: '-0.5px', left: '50%', transform: 'translateX(-50%)', height: '2px', background: '#ffffff', borderRadius: '1px', opacity: isActive ? 1 : 0, transition: 'opacity 200ms ease' }}>
                        <span style={{ visibility: 'hidden', fontSize: '13px', fontWeight: 500, fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>{tab}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                {addPanelTab === 'Style' && addSelectedCategory ? (
                  <div>
                    <div style={{ padding: '12px 16px 8px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                      {addSelectedCategory} — Select Style
                      {(addSelectedCategory === 'Wall' || addSelectedCategory === 'Floor') && editMytylesTiles.length > 0 && (
                        <span style={{ marginLeft: 6, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>(Mytyles)</span>
                      )}
                      {((addSelectedCategory === 'Sofa' && editSofaProducts.length > 0) ||
                        (addSelectedCategory === 'Chair' && editChairProducts.length > 0) ||
                        (addSelectedCategory === 'Bed' && editBedProducts.length > 0) ||
                        (addSelectedCategory === 'Mattress' && editMattressProducts.length > 0) ||
                        (addSelectedCategory === 'Table' && editTableProducts.length > 0) ||
                        (addSelectedCategory === 'Dining' && editDiningProducts.length > 0) ||
                        (addSelectedCategory === 'Cabinet' && editCabinetProducts.length > 0) ||
                        (addSelectedCategory === 'Carpet' && editCarpetProducts.length > 0)) && (
                        <span style={{ marginLeft: 6, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>(catalog)</span>
                      )}
                      {addSelectedCategory === 'Lighting' && editLightingProducts.length > 0 && (
                        <span style={{ marginLeft: 6, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>(catalog)</span>
                      )}
                      {addSelectedCategory === 'Decor' && editDecorProducts.length > 0 && (
                        <span style={{ marginLeft: 6, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>(catalog)</span>
                      )}
                    </div>
                    {(addSelectedCategory === 'Wall' || addSelectedCategory === 'Floor') && editMytylesLoading && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading vitrified tiles from Supabase…</div>
                    )}
                    {(addSelectedCategory === 'Sofa' || addSelectedCategory === 'Chair') && (editSofaLoading || editChairLoading) && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>
                        Loading {addSelectedCategory?.toLowerCase()}s from catalog…
                      </div>
                    )}
                    {addSelectedCategory === 'Bed' && editBedLoading && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading beds from catalog…</div>
                    )}
                    {addSelectedCategory === 'Mattress' && editMattressLoading && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading mattresses from catalog…</div>
                    )}
                    {addSelectedCategory === 'Carpet' && editCarpetLoading && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading carpets / rugs from catalog…</div>
                    )}
                    {addSelectedCategory === 'Table' && editTableLoading && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading tables from catalog…</div>
                    )}
                    {addSelectedCategory === 'Dining' && editDiningLoading && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading dining from catalog…</div>
                    )}
                    {addSelectedCategory === 'Cabinet' && editCabinetLoading && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading cabinets / storage from catalog…</div>
                    )}
                    {addSelectedCategory === 'Lighting' && editLightingLoading && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading lighting from catalog…</div>
                    )}
                    {addSelectedCategory === 'Decor' && editDecorLoading && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading decor from catalog…</div>
                    )}
                    {(addSelectedCategory === 'Wall' || addSelectedCategory === 'Floor') && editMytylesError && editMytylesTiles.length === 0 && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editMytylesError}</div>
                    )}
                    {addSelectedCategory === 'Sofa' && editSofaError && editSofaProducts.length === 0 && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editSofaError}</div>
                    )}
                    {addSelectedCategory === 'Chair' && editChairError && editChairProducts.length === 0 && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editChairError}</div>
                    )}
                    {addSelectedCategory === 'Bed' && editBedError && editBedProducts.length === 0 && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editBedError}</div>
                    )}
                    {addSelectedCategory === 'Mattress' && editMattressError && editMattressProducts.length === 0 && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editMattressError}</div>
                    )}
                    {addSelectedCategory === 'Carpet' && editCarpetError && editCarpetProducts.length === 0 && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editCarpetError}</div>
                    )}
                    {addSelectedCategory === 'Table' && editTableError && editTableProducts.length === 0 && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editTableError}</div>
                    )}
                    {addSelectedCategory === 'Dining' && editDiningError && editDiningProducts.length === 0 && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editDiningError}</div>
                    )}
                    {addSelectedCategory === 'Cabinet' && editCabinetError && editCabinetProducts.length === 0 && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editCabinetError}</div>
                    )}
                    {addSelectedCategory === 'Lighting' && editLightingError && editLightingProducts.length === 0 && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editLightingError}</div>
                    )}
                    {addSelectedCategory === 'Decor' && editDecorError && editDecorProducts.length === 0 && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editDecorError}</div>
                    )}
                    <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {catalogStyleSwatchRows.map((sw) => (
                        <div key={sw.k} style={{ cursor: 'pointer' }} title={sw.title} onClick={() => setAddSelectedStyleSwatch(sw.k)}>
                          <div style={{ width: 100, height: 100, borderRadius: 8, overflow: 'hidden', border: addSelectedStyleSwatch === sw.k ? '1.5px solid #ffffff' : '1.5px solid transparent', transition: 'border-color 150ms ease' }}>
                            <img src={sw.img} alt={sw.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          </div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 4, lineHeight: 1.35 }}>{sw.n}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : addPanelTab === 'Colour' && addSelectedCategory ? (
                  <div>
                    <div style={{ padding: '12px 16px 8px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{addSelectedCategory} — Select Colour</div>
                    <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {(({
                        'Wall':[{c:'#F5F0E0',n:'Warm White'},{c:'#D4C9A8',n:'Sand Beige'},{c:'#8BAE8B',n:'Sage Green'},{c:'#6B7B8D',n:'Slate Grey'},{c:'#C4704A',n:'Terracotta'},{c:'#2C3E6B',n:'Navy Blue'}],
                        'Floor':[{c:'#A0785A',n:'Warm Oak'},{c:'#D4C9B0',n:'Light Maple'},{c:'#5A4030',n:'Dark Walnut'},{c:'#C8B89A',n:'Natural Birch'},{c:'#8B8B8B',n:'Concrete Grey'},{c:'#E8DDD0',n:'Ivory Tile'}],
                        'Ceiling':[{c:'#FFFFFF',n:'Pure White'},{c:'#F5F0E8',n:'Soft Cream'},{c:'#E8E0D0',n:'Warm Ivory'},{c:'#D0D0D0',n:'Light Grey'},{c:'#C8D8D8',n:'Sky Mist'},{c:'#F0E8D8',n:'Antique White'}],
                        'Sofa':[{c:'#4A6B8A',n:'Steel Blue'},{c:'#8B6B50',n:'Camel Brown'},{c:'#505050',n:'Charcoal'},{c:'#C4956A',n:'Tan Leather'},{c:'#6B8B6B',n:'Olive Green'},{c:'#D4C9B0',n:'Cream'}],
                        'Chair':[{c:'#2C2C2C',n:'Matte Black'},{c:'#C8B89A',n:'Light Wood'},{c:'#6B5B45',n:'Walnut'},{c:'#E0E0E0',n:'White'},{c:'#8B4040',n:'Burgundy'},{c:'#4A6B5A',n:'Forest Green'}],
                        'Desk':[{c:'#A0785A',n:'Natural Oak'},{c:'#3A3A3A',n:'Black'},{c:'#FFFFFF',n:'White Gloss'},{c:'#5A4030',n:'Dark Walnut'},{c:'#B0A090',n:'Ash Grey'}],
                        'Table':[{c:'#8B7355',n:'Rustic Wood'},{c:'#2C2C2C',n:'Black Metal'},{c:'#E0D8C8',n:'White Oak'},{c:'#C0C0C0',n:'Brushed Steel'},{c:'#5A4030',n:'Espresso'},{c:'#D4C0A0',n:'Natural Pine'}],
                        'Cabinet':[{c:'#FFFFFF',n:'White'},{c:'#4A5A6A',n:'Navy Blue'},{c:'#6B5B45',n:'Walnut'},{c:'#8B8B7B',n:'Sage'},{c:'#2C2C2C',n:'Matte Black'},{c:'#C8B89A',n:'Light Oak'}],
                        'Door':[{c:'#FFFFFF',n:'White'},{c:'#8B7355',n:'Oak'},{c:'#3A3A3A',n:'Charcoal'},{c:'#5A4030',n:'Mahogany'},{c:'#B0A090',n:'Grey Wash'},{c:'#2C4A2C',n:'Forest Green'}],
                        'Window':[{c:'#2C2C2C',n:'Black Frame'},{c:'#FFFFFF',n:'White Frame'},{c:'#8B7355',n:'Oak Frame'},{c:'#808080',n:'Grey Frame'},{c:'#C4956A',n:'Bronze Frame'}],
                        'Glass':[{c:'#E8F4F8',n:'Clear'},{c:'#D0E8E0',n:'Frosted Green'},{c:'#D8D8E0',n:'Smoked Grey'},{c:'#D0E0F0',n:'Blue Tint'},{c:'#F0E8D0',n:'Amber Tint'},{c:'#E0E0E0',n:'Frosted White'}],
                        'Partition':[{c:'#FFFFFF',n:'White'},{c:'#C8B89A',n:'Light Wood'},{c:'#2C2C2C',n:'Black'},{c:'#D0D0D0',n:'Light Grey'},{c:'#8B7B6B',n:'Warm Taupe'}],
                        'Carpet':[{c:'#A0785A',n:'Warm Beige'},{c:'#6B5344',n:'Chocolate'},{c:'#2C2C2C',n:'Charcoal'},{c:'#C4A574',n:'Sand'},{c:'#8B4040',n:'Burgundy'},{c:'#4A5D4A',n:'Sage'}],
                        'Decor':[{c:'#C4956A',n:'Brass Gold'},{c:'#2C2C2C',n:'Matte Black'},{c:'#FFFFFF',n:'Ceramic White'},{c:'#8BAE8B',n:'Sage Green'},{c:'#C4704A',n:'Terracotta'},{c:'#4A6B8A',n:'Ocean Blue'}],'Lighting':[{c:'#FFF8E8',n:'Warm White'},{c:'#E8F0FF',n:'Cool White'},{c:'#C9A227',n:'Brass'},{c:'#2C2C2C',n:'Matte Black'},{c:'#C0C4C8',n:'Brushed Nickel'},{c:'#F5E6D3',n:'Ivory Shade'}],
                      } as Record<string,{c:string,n:string}[]>)[addSelectedCategory] || []).map((sw, i) => (
                        <div key={i} style={{ cursor: 'pointer' }} onClick={() => setAddSelectedColorDots([sw.c])}>
                          <div style={{ width: 100, height: 100, borderRadius: 8, background: sw.c, border: addSelectedColorDots?.[0] === sw.c ? '1.5px solid #ffffff' : '1.5px solid transparent', transition: 'border-color 150ms ease' }} />
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 4 }}>{sw.n}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : addPanelTab === 'Material' && addSelectedCategory ? (
                  <div>
                    <div style={{ padding: '12px 16px 8px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{addSelectedCategory} — Select Material</div>
                    <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {(({
                        'Wall':[{img:'https://images.unsplash.com/photo-1661533816434-63ee0321ab8f?w=200&h=200&fit=crop',n:'Plaster'},{img:'https://images.unsplash.com/photo-1677993780799-fb17d314336a?w=200&h=200&fit=crop',n:'Brick'},{img:'https://images.unsplash.com/photo-1771795638652-01821921a461?w=200&h=200&fit=crop',n:'Marble'},{img:'https://images.unsplash.com/photo-1632324875014-b5713099bef4?w=200&h=200&fit=crop',n:'Concrete'},{img:'https://images.unsplash.com/photo-1691941896284-708ae594a8ce?w=200&h=200&fit=crop',n:'Wallpaper'},{img:'https://images.unsplash.com/photo-1630365037039-e5aeca9579d1?w=200&h=200&fit=crop',n:'Wood Panel'}],
                        'Floor':[{img:'https://images.unsplash.com/photo-1711915442858-2a5bb7ba67d8?w=200&h=200&fit=crop',n:'Hardwood'},{img:'https://images.unsplash.com/photo-1695191388218-f6259600223f?w=200&h=200&fit=crop',n:'Tile'},{img:'https://images.unsplash.com/photo-1770086962001-3da4f60e7db5?w=200&h=200&fit=crop',n:'Marble'},{img:'https://images.unsplash.com/photo-1771531072574-af6ed6b954c0?w=200&h=200&fit=crop',n:'Concrete'},{img:'https://images.unsplash.com/photo-1642942552674-8302b1123460?w=200&h=200&fit=crop',n:'Vinyl'},{img:'https://images.unsplash.com/photo-1756361771374-8796aab066da?w=200&h=200&fit=crop',n:'Carpet'}],
                        'Ceiling':[{img:'https://images.unsplash.com/photo-1661533816434-63ee0321ab8f?w=200&h=200&fit=crop',n:'Plaster'},{img:'https://images.unsplash.com/photo-1743228645752-45973135b533?w=200&h=200&fit=crop',n:'Wood'},{img:'https://images.unsplash.com/photo-1551148552-b631bbe476b2?w=200&h=200&fit=crop',n:'Gypsum'},{img:'https://images.unsplash.com/photo-1632324875014-b5713099bef4?w=200&h=200&fit=crop',n:'Concrete'},{img:'https://images.unsplash.com/photo-1758887250669-9ce43c44611d?w=200&h=200&fit=crop',n:'Metal'},{img:'https://images.unsplash.com/photo-1570748494944-9683b21d4521?w=200&h=200&fit=crop',n:'Acoustic Panel'}],
                        'Sofa':[{img:'https://images.unsplash.com/photo-1686806374120-e7ae3f19801d?w=200&h=200&fit=crop',n:'Linen'},{img:'https://images.unsplash.com/photo-1707135109903-535d368cc9e8?w=200&h=200&fit=crop',n:'Velvet'},{img:'https://images.unsplash.com/photo-1771153689015-cfc0db48ae27?w=200&h=200&fit=crop',n:'Leather'},{img:'https://images.unsplash.com/photo-1697247079184-efb23487a172?w=200&h=200&fit=crop',n:'Boucle'},{img:'https://images.unsplash.com/photo-1733145857366-fc99411080b8?w=200&h=200&fit=crop',n:'Cotton'},{img:'https://images.unsplash.com/photo-1657935937312-1ad849214aea?w=200&h=200&fit=crop',n:'Suede'}],
                        'Chair':[{img:'https://images.unsplash.com/photo-1771153689015-cfc0db48ae27?w=200&h=200&fit=crop',n:'Leather'},{img:'https://images.unsplash.com/photo-1771098302185-2d99a6fb2379?w=200&h=200&fit=crop',n:'Fabric'},{img:'https://images.unsplash.com/photo-1683557165720-cc8dd486233c?w=200&h=200&fit=crop',n:'Oak'},{img:'https://images.unsplash.com/photo-1667660664335-f026a2614577?w=200&h=200&fit=crop',n:'Metal'},{img:'https://images.unsplash.com/photo-1707135109903-535d368cc9e8?w=200&h=200&fit=crop',n:'Velvet'},{img:'https://images.unsplash.com/photo-1565672850526-ba956f6fc6fc?w=200&h=200&fit=crop',n:'Rattan'}],
                        'Desk':[{img:'https://images.unsplash.com/photo-1683557165720-cc8dd486233c?w=200&h=200&fit=crop',n:'Oak'},{img:'https://images.unsplash.com/photo-1646006409295-f1b05e7200f5?w=200&h=200&fit=crop',n:'Teak'},{img:'https://images.unsplash.com/photo-1764922200030-ce7748574bb8?w=200&h=200&fit=crop',n:'Walnut'},{img:'https://images.unsplash.com/photo-1667660664335-f026a2614577?w=200&h=200&fit=crop',n:'Metal'},{img:'https://images.unsplash.com/photo-1771795638652-01821921a461?w=200&h=200&fit=crop',n:'Marble Top'},{img:'https://images.unsplash.com/photo-1772992552339-2f43cfa07b9c?w=200&h=200&fit=crop',n:'Glass Top'}],
                        'Table':[{img:'https://images.unsplash.com/photo-1683557165720-cc8dd486233c?w=200&h=200&fit=crop',n:'Oak'},{img:'https://images.unsplash.com/photo-1771795638652-01821921a461?w=200&h=200&fit=crop',n:'Marble'},{img:'https://images.unsplash.com/photo-1761079976271-3a78f547ca67?w=200&h=200&fit=crop',n:'Steel'},{img:'https://images.unsplash.com/photo-1772992552339-2f43cfa07b9c?w=200&h=200&fit=crop',n:'Glass'},{img:'https://images.unsplash.com/photo-1764922200030-ce7748574bb8?w=200&h=200&fit=crop',n:'Walnut'},{img:'https://images.unsplash.com/photo-1632324875014-b5713099bef4?w=200&h=200&fit=crop',n:'Concrete'}],
                        'Cabinet':[{img:'https://images.unsplash.com/photo-1683557165720-cc8dd486233c?w=200&h=200&fit=crop',n:'Oak'},{img:'https://images.unsplash.com/photo-1764922200030-ce7748574bb8?w=200&h=200&fit=crop',n:'Walnut'},{img:'https://images.unsplash.com/photo-1661533816434-63ee0321ab8f?w=200&h=200&fit=crop',n:'Lacquer'},{img:'https://images.unsplash.com/photo-1667660664335-f026a2614577?w=200&h=200&fit=crop',n:'Metal'},{img:'https://images.unsplash.com/photo-1768425245014-2d9855bf4a65?w=200&h=200&fit=crop',n:'Bamboo'},{img:'https://images.unsplash.com/photo-1646006409295-f1b05e7200f5?w=200&h=200&fit=crop',n:'Teak'}],
                        'Door':[{img:'https://images.unsplash.com/photo-1683557165720-cc8dd486233c?w=200&h=200&fit=crop',n:'Oak'},{img:'https://images.unsplash.com/photo-1764922200030-ce7748574bb8?w=200&h=200&fit=crop',n:'Walnut'},{img:'https://images.unsplash.com/photo-1667660664335-f026a2614577?w=200&h=200&fit=crop',n:'Metal'},{img:'https://images.unsplash.com/photo-1772992552339-2f43cfa07b9c?w=200&h=200&fit=crop',n:'Glass Panel'},{img:'https://images.unsplash.com/photo-1661533816434-63ee0321ab8f?w=200&h=200&fit=crop',n:'Painted'},{img:'https://images.unsplash.com/photo-1646006409295-f1b05e7200f5?w=200&h=200&fit=crop',n:'Teak'}],
                        'Window':[{img:'https://images.unsplash.com/photo-1667660664335-f026a2614577?w=200&h=200&fit=crop',n:'Aluminium'},{img:'https://images.unsplash.com/photo-1683557165720-cc8dd486233c?w=200&h=200&fit=crop',n:'Wood Frame'},{img:'https://images.unsplash.com/photo-1761079976271-3a78f547ca67?w=200&h=200&fit=crop',n:'Steel Frame'},{img:'https://images.unsplash.com/photo-1772992552339-2f43cfa07b9c?w=200&h=200&fit=crop',n:'Clear Glass'},{img:'https://images.unsplash.com/photo-1596902362438-e8516a972fb5?w=200&h=200&fit=crop',n:'Tinted Glass'},{img:'https://images.unsplash.com/photo-1632324875014-b5713099bef4?w=200&h=200&fit=crop',n:'UPVC'}],
                        'Glass':[{img:'https://images.unsplash.com/photo-1772992552339-2f43cfa07b9c?w=200&h=200&fit=crop',n:'Clear'},{img:'https://images.unsplash.com/photo-1596902362438-e8516a972fb5?w=200&h=200&fit=crop',n:'Tinted'},{img:'https://images.unsplash.com/photo-1551148552-b631bbe476b2?w=200&h=200&fit=crop',n:'Frosted'},{img:'https://images.unsplash.com/photo-1763965780173-a94955ed16c7?w=200&h=200&fit=crop',n:'Textured'},{img:'https://images.unsplash.com/photo-1648583189779-536c76a17957?w=200&h=200&fit=crop',n:'Wire Mesh'},{img:'https://images.unsplash.com/photo-1771795638652-01821921a461?w=200&h=200&fit=crop',n:'Etched'}],
                        'Partition':[{img:'https://images.unsplash.com/photo-1772992552339-2f43cfa07b9c?w=200&h=200&fit=crop',n:'Glass'},{img:'https://images.unsplash.com/photo-1683557165720-cc8dd486233c?w=200&h=200&fit=crop',n:'Wood'},{img:'https://images.unsplash.com/photo-1667660664335-f026a2614577?w=200&h=200&fit=crop',n:'Metal'},{img:'https://images.unsplash.com/photo-1771098302185-2d99a6fb2379?w=200&h=200&fit=crop',n:'Fabric'},{img:'https://images.unsplash.com/photo-1565672850526-ba956f6fc6fc?w=200&h=200&fit=crop',n:'Rattan'},{img:'https://images.unsplash.com/photo-1661533816434-63ee0321ab8f?w=200&h=200&fit=crop',n:'Plaster'}],
                        'Carpet':[{img:'https://images.unsplash.com/photo-1600166898405-3aad6191b57b?w=200&h=200&fit=crop',n:'Wool'},{img:'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=200&h=200&fit=crop',n:'Jute'},{img:'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=200&h=200&fit=crop',n:'Cotton'},{img:'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=200&h=200&fit=crop',n:'Silk Blend'},{img:'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200&h=200&fit=crop',n:'Shag'},{img:'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=200&h=200&fit=crop',n:'Flatweave'}],
                        'Decor':[{img:'https://images.unsplash.com/photo-1572596116404-98f227c01ac1?w=200&h=200&fit=crop',n:'Ceramic'},{img:'https://images.unsplash.com/photo-1667660664335-f026a2614577?w=200&h=200&fit=crop',n:'Metal'},{img:'https://images.unsplash.com/photo-1772992552339-2f43cfa07b9c?w=200&h=200&fit=crop',n:'Glass'},{img:'https://images.unsplash.com/photo-1750791007759-ae174e1e63cf?w=200&h=200&fit=crop',n:'Stone'},{img:'https://images.unsplash.com/photo-1683557165720-cc8dd486233c?w=200&h=200&fit=crop',n:'Wood'},{img:'https://images.unsplash.com/photo-1565672850526-ba956f6fc6fc?w=200&h=200&fit=crop',n:'Rattan'}],'Lighting':[{img:'https://images.unsplash.com/photo-1667660664335-f026a2614577?w=200&h=200&fit=crop',n:'Brushed Metal'},{img:'https://images.unsplash.com/photo-1772992552339-2f43cfa07b9c?w=200&h=200&fit=crop',n:'Glass'},{img:'https://images.unsplash.com/photo-1572596116404-98f227c01ac1?w=200&h=200&fit=crop',n:'Ceramic Base'},{img:'https://images.unsplash.com/photo-1771098302185-2d99a6fb2379?w=200&h=200&fit=crop',n:'Fabric Shade'},{img:'https://images.unsplash.com/photo-1683557165720-cc8dd486233c?w=200&h=200&fit=crop',n:'Wood Accent'},{img:'https://images.unsplash.com/photo-1771795638652-01821921a461?w=200&h=200&fit=crop',n:'Marble Base'}],
                      } as Record<string,{img:string,n:string}[]>)[addSelectedCategory] || []).map((sw, i) => (
                        <div key={i} style={{ cursor: 'pointer' }} onClick={() => { setAddSelectedMaterial(sw.n); setAddSelectedMaterialImageUrl(sw.img); }}>
                          <div style={{ width: 100, height: 100, borderRadius: 8, overflow: 'hidden', border: addSelectedMaterial === sw.n ? '1.5px solid #ffffff' : '1.5px solid transparent', transition: 'border-color 150ms ease' }}>
                            <img src={sw.img} alt={sw.n} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          </div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 4 }}>{sw.n}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '20px 16px', fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                    Pick an object category on the left to choose style, colour, and material.
                  </div>
                )}
              </div>
              <div style={{ padding: '8px 16px 0', display: 'flex', flexWrap: 'nowrap', gap: '8px', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.28)',
                    borderRadius: 999,
                    padding: '4px 10px',
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.92)',
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                  title="Upload reference image"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L6 21" />
                    <path d="m14 19.5 3-3 3 3" />
                    <path d="M17 22v-5.5" />
                    <circle cx="9" cy="9" r="2" />
                  </svg>
                  <span>Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddObjectSubPanel('generatePrompt')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.28)',
                    borderRadius: 999,
                    padding: '4px 10px',
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.92)',
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                  title="Use text prompt"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M12 4v16" />
                    <path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2" />
                    <path d="M9 20h6" />
                  </svg>
                  <span>Text prompt</span>
                </button>
              </div>
              <div style={{ padding: isMobile ? '12px 16px 96px' : '12px 16px 16px', flexShrink: 0 }}>
                {addSelectedCategory &&
                  !captureLocked &&
                  (Boolean(addSelectedStyleSwatch?.trim()) ||
                    Boolean(addSelectedMaterial?.trim()) ||
                    Boolean(addSelectedColorDots && addSelectedColorDots.length > 0)) && (
                    <div
                      style={{
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.5)',
                        lineHeight: 1.45,
                        marginBottom: 10,
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Use{' '}
                      <span style={{ color: 'rgba(255,255,255,0.78)', fontWeight: 600 }}>Capture Area</span> on the
                      room image, confirm the box, then Add to Image — the selected product photo is sent to the AI as
                      a reference.
                    </div>
                  )}
                <button
                  type="button"
                  disabled={addCatalogToImageDisabled}
                  onClick={() => {
                    if (isMobile) setMobileRightPanelOpen(false);
                    void handleAddObjectApply();
                  }}
                  style={{
                    width: '100%',
                    height: '44px',
                    borderRadius: '8px',
                    background: '#000000',
                    border: '1.5px solid #FFFFFF',
                    cursor: addCatalogToImageDisabled ? 'not-allowed' : 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#FFFFFF',
                    letterSpacing: '-0.1px',
                    transition: 'all 180ms ease',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.22)',
                    opacity: addCatalogToImageDisabled ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (addCatalogToImageDisabled) return;
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.85)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.32)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#000000';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.22)';
                  }}
                >
                  {apiGenerating && apiGenerateKind === 'add' ? 'Adding…' : 'Add to Image'}
                </button>
              </div>
            </div>
          </div>
        ) : isCustomisation && customActiveTab === 'Replace' ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: "'Inter', sans-serif", position: 'relative' }}>
            {/* Replace — Style / Colour / Material (mirrors Add Object) */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 1, display: 'flex', flexDirection: 'column', opacity: replaceSubPanel === null ? 1 : 0, pointerEvents: replaceSubPanel === null ? 'auto' : 'none', transition: 'opacity 250ms ease' }}>
              <div style={{ padding: '12px 16px 0', borderBottom: '0.5px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'row', flexShrink: 0 }}>
                {(['Style', 'Colour', 'Material'] as const).map((tab) => {
                  const isActive = replacePanelTab === tab;
                  return (
                    <div
                      key={tab}
                      onClick={() => setReplacePanelTab(tab)}
                      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', paddingBottom: '10px', position: 'relative' }}
                    >
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: isActive ? 500 : 400, color: isActive ? '#ffffff' : 'rgba(255,255,255,0.4)', transition: 'color 200ms ease', userSelect: 'none' }}>{tab}</span>
                      <div style={{ position: 'absolute', bottom: '-0.5px', left: '50%', transform: 'translateX(-50%)', height: '2px', background: '#ffffff', borderRadius: '1px', opacity: isActive ? 1 : 0, transition: 'opacity 200ms ease' }}>
                        <span style={{ visibility: 'hidden', fontSize: '13px', fontWeight: 500, fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>{tab}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                {replacePanelTab === 'Style' && replaceSelectedCategory ? (
                  <div>
                    <div style={{ padding: '12px 16px 8px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                      {replaceSelectedCategory} — Select Style
                      {(replaceSelectedCategory === 'Wall' || replaceSelectedCategory === 'Floor') && editMytylesTiles.length > 0 && (
                        <span style={{ marginLeft: 6, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>(Mytyles)</span>
                      )}
                      {((replaceSelectedCategory === 'Sofa' && editSofaProducts.length > 0) ||
                        (replaceSelectedCategory === 'Chair' && editChairProducts.length > 0) ||
                        (replaceSelectedCategory === 'Bed' && editBedProducts.length > 0) ||
                        (replaceSelectedCategory === 'Mattress' && editMattressProducts.length > 0) ||
                        (replaceSelectedCategory === 'Table' && editTableProducts.length > 0) ||
                        (replaceSelectedCategory === 'Dining' && editDiningProducts.length > 0) ||
                        (replaceSelectedCategory === 'Cabinet' && editCabinetProducts.length > 0) ||
                        (replaceSelectedCategory === 'Carpet' && editCarpetProducts.length > 0)) && (
                        <span style={{ marginLeft: 6, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>(catalog)</span>
                      )}
                      {replaceSelectedCategory === 'Lighting' && editLightingProducts.length > 0 && (
                        <span style={{ marginLeft: 6, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>(catalog)</span>
                      )}
                      {replaceSelectedCategory === 'Decor' && editDecorProducts.length > 0 && (
                        <span style={{ marginLeft: 6, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>(catalog)</span>
                      )}
                    </div>
                    {(replaceSelectedCategory === 'Wall' || replaceSelectedCategory === 'Floor') && editMytylesLoading && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading vitrified tiles from Supabase…</div>
                    )}
                    {(replaceSelectedCategory === 'Sofa' || replaceSelectedCategory === 'Chair') && (editSofaLoading || editChairLoading) && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>
                        Loading {replaceSelectedCategory?.toLowerCase()}s from catalog…
                      </div>
                    )}
                    {replaceSelectedCategory === 'Bed' && editBedLoading && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading beds from catalog…</div>
                    )}
                    {replaceSelectedCategory === 'Mattress' && editMattressLoading && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading mattresses from catalog…</div>
                    )}
                    {replaceSelectedCategory === 'Table' && editTableLoading && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading tables from catalog…</div>
                    )}
                    {replaceSelectedCategory === 'Dining' && editDiningLoading && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading dining from catalog…</div>
                    )}
                    {replaceSelectedCategory === 'Cabinet' && editCabinetLoading && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading cabinets / storage from catalog…</div>
                    )}
                    {replaceSelectedCategory === 'Carpet' && editCarpetLoading && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading carpets / rugs from catalog…</div>
                    )}
                    {replaceSelectedCategory === 'Lighting' && editLightingLoading && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading lighting from catalog…</div>
                    )}
                    {replaceSelectedCategory === 'Decor' && editDecorLoading && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading decor from catalog…</div>
                    )}
                    {(replaceSelectedCategory === 'Wall' || replaceSelectedCategory === 'Floor') && editMytylesError && editMytylesTiles.length === 0 && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editMytylesError}</div>
                    )}
                    {replaceSelectedCategory === 'Sofa' && editSofaError && editSofaProducts.length === 0 && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editSofaError}</div>
                    )}
                    {replaceSelectedCategory === 'Chair' && editChairError && editChairProducts.length === 0 && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editChairError}</div>
                    )}
                    {replaceSelectedCategory === 'Bed' && editBedError && editBedProducts.length === 0 && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editBedError}</div>
                    )}
                    {replaceSelectedCategory === 'Mattress' && editMattressError && editMattressProducts.length === 0 && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editMattressError}</div>
                    )}
                    {replaceSelectedCategory === 'Table' && editTableError && editTableProducts.length === 0 && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editTableError}</div>
                    )}
                    {replaceSelectedCategory === 'Dining' && editDiningError && editDiningProducts.length === 0 && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editDiningError}</div>
                    )}
                    {replaceSelectedCategory === 'Cabinet' && editCabinetError && editCabinetProducts.length === 0 && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editCabinetError}</div>
                    )}
                    {replaceSelectedCategory === 'Carpet' && editCarpetError && editCarpetProducts.length === 0 && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editCarpetError}</div>
                    )}
                    {replaceSelectedCategory === 'Lighting' && editLightingError && editLightingProducts.length === 0 && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editLightingError}</div>
                    )}
                    {replaceSelectedCategory === 'Decor' && editDecorError && editDecorProducts.length === 0 && (
                      <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editDecorError}</div>
                    )}
                    <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {catalogStyleSwatchRows.map((sw) => (
                        <div key={sw.k} style={{ cursor: 'pointer' }} title={sw.title} onClick={() => setReplaceSelectedStyleSwatch(sw.k)}>
                          <div style={{ width: 100, height: 100, borderRadius: 8, overflow: 'hidden', border: replaceSelectedStyleSwatch === sw.k ? '1.5px solid #ffffff' : '1.5px solid transparent', transition: 'border-color 150ms ease' }}>
                            <img src={sw.img} alt={sw.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          </div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 4, lineHeight: 1.35 }}>{sw.n}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : replacePanelTab === 'Colour' && replaceSelectedCategory ? (
                  <div>
                    <div style={{ padding: '12px 16px 8px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{replaceSelectedCategory} — Select Colour</div>
                    <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {(({
                        'Wall':[{c:'#F5F0E0',n:'Warm White'},{c:'#D4C9A8',n:'Sand Beige'},{c:'#8BAE8B',n:'Sage Green'},{c:'#6B7B8D',n:'Slate Grey'},{c:'#C4704A',n:'Terracotta'},{c:'#2C3E6B',n:'Navy Blue'}],
                        'Floor':[{c:'#A0785A',n:'Warm Oak'},{c:'#D4C9B0',n:'Light Maple'},{c:'#5A4030',n:'Dark Walnut'},{c:'#C8B89A',n:'Natural Birch'},{c:'#8B8B8B',n:'Concrete Grey'},{c:'#E8DDD0',n:'Ivory Tile'}],
                        'Ceiling':[{c:'#FFFFFF',n:'Pure White'},{c:'#F5F0E8',n:'Soft Cream'},{c:'#E8E0D0',n:'Warm Ivory'},{c:'#D0D0D0',n:'Light Grey'},{c:'#C8D8D8',n:'Sky Mist'},{c:'#F0E8D8',n:'Antique White'}],
                        'Sofa':[{c:'#4A6B8A',n:'Steel Blue'},{c:'#8B6B50',n:'Camel Brown'},{c:'#505050',n:'Charcoal'},{c:'#C4956A',n:'Tan Leather'},{c:'#6B8B6B',n:'Olive Green'},{c:'#D4C9B0',n:'Cream'}],
                        'Chair':[{c:'#2C2C2C',n:'Matte Black'},{c:'#C8B89A',n:'Light Wood'},{c:'#6B5B45',n:'Walnut'},{c:'#E0E0E0',n:'White'},{c:'#8B4040',n:'Burgundy'},{c:'#4A6B5A',n:'Forest Green'}],
                        'Desk':[{c:'#A0785A',n:'Natural Oak'},{c:'#3A3A3A',n:'Black'},{c:'#FFFFFF',n:'White Gloss'},{c:'#5A4030',n:'Dark Walnut'},{c:'#B0A090',n:'Ash Grey'}],
                        'Table':[{c:'#8B7355',n:'Rustic Wood'},{c:'#2C2C2C',n:'Black Metal'},{c:'#E0D8C8',n:'White Oak'},{c:'#C0C0C0',n:'Brushed Steel'},{c:'#5A4030',n:'Espresso'},{c:'#D4C0A0',n:'Natural Pine'}],
                        'Cabinet':[{c:'#FFFFFF',n:'White'},{c:'#4A5A6A',n:'Navy Blue'},{c:'#6B5B45',n:'Walnut'},{c:'#8B8B7B',n:'Sage'},{c:'#2C2C2C',n:'Matte Black'},{c:'#C8B89A',n:'Light Oak'}],
                        'Door':[{c:'#FFFFFF',n:'White'},{c:'#8B7355',n:'Oak'},{c:'#3A3A3A',n:'Charcoal'},{c:'#5A4030',n:'Mahogany'},{c:'#B0A090',n:'Grey Wash'},{c:'#2C4A2C',n:'Forest Green'}],
                        'Window':[{c:'#2C2C2C',n:'Black Frame'},{c:'#FFFFFF',n:'White Frame'},{c:'#8B7355',n:'Oak Frame'},{c:'#808080',n:'Grey Frame'},{c:'#C4956A',n:'Bronze Frame'}],
                        'Glass':[{c:'#E8F4F8',n:'Clear'},{c:'#D0E8E0',n:'Frosted Green'},{c:'#D8D8E0',n:'Smoked Grey'},{c:'#D0E0F0',n:'Blue Tint'},{c:'#F0E8D0',n:'Amber Tint'},{c:'#E0E0E0',n:'Frosted White'}],
                        'Partition':[{c:'#FFFFFF',n:'White'},{c:'#C8B89A',n:'Light Wood'},{c:'#2C2C2C',n:'Black'},{c:'#D0D0D0',n:'Light Grey'},{c:'#8B7B6B',n:'Warm Taupe'}],
                        'Carpet':[{c:'#A0785A',n:'Warm Beige'},{c:'#6B5344',n:'Chocolate'},{c:'#2C2C2C',n:'Charcoal'},{c:'#C4A574',n:'Sand'},{c:'#8B4040',n:'Burgundy'},{c:'#4A5D4A',n:'Sage'}],
                        'Decor':[{c:'#C4956A',n:'Brass Gold'},{c:'#2C2C2C',n:'Matte Black'},{c:'#FFFFFF',n:'Ceramic White'},{c:'#8BAE8B',n:'Sage Green'},{c:'#C4704A',n:'Terracotta'},{c:'#4A6B8A',n:'Ocean Blue'}],'Lighting':[{c:'#FFF8E8',n:'Warm White'},{c:'#E8F0FF',n:'Cool White'},{c:'#C9A227',n:'Brass'},{c:'#2C2C2C',n:'Matte Black'},{c:'#C0C4C8',n:'Brushed Nickel'},{c:'#F5E6D3',n:'Ivory Shade'}],
                      } as Record<string,{c:string,n:string}[]>)[replaceSelectedCategory] || []).map((sw, i) => (
                        <div key={i} style={{ cursor: 'pointer' }} onClick={() => setReplaceSelectedColorDots([sw.c])}>
                          <div style={{ width: 100, height: 100, borderRadius: 8, background: sw.c, border: replaceSelectedColorDots?.[0] === sw.c ? '1.5px solid #ffffff' : '1.5px solid transparent', transition: 'border-color 150ms ease' }} />
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 4 }}>{sw.n}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : replacePanelTab === 'Material' && replaceSelectedCategory ? (
                  <div>
                    <div style={{ padding: '12px 16px 8px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{replaceSelectedCategory} — Select Material</div>
                    <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {(({
                        'Wall':[{img:'https://images.unsplash.com/photo-1661533816434-63ee0321ab8f?w=200&h=200&fit=crop',n:'Plaster'},{img:'https://images.unsplash.com/photo-1677993780799-fb17d314336a?w=200&h=200&fit=crop',n:'Brick'},{img:'https://images.unsplash.com/photo-1771795638652-01821921a461?w=200&h=200&fit=crop',n:'Marble'},{img:'https://images.unsplash.com/photo-1632324875014-b5713099bef4?w=200&h=200&fit=crop',n:'Concrete'},{img:'https://images.unsplash.com/photo-1691941896284-708ae594a8ce?w=200&h=200&fit=crop',n:'Wallpaper'},{img:'https://images.unsplash.com/photo-1630365037039-e5aeca9579d1?w=200&h=200&fit=crop',n:'Wood Panel'}],
                        'Floor':[{img:'https://images.unsplash.com/photo-1711915442858-2a5bb7ba67d8?w=200&h=200&fit=crop',n:'Hardwood'},{img:'https://images.unsplash.com/photo-1695191388218-f6259600223f?w=200&h=200&fit=crop',n:'Tile'},{img:'https://images.unsplash.com/photo-1770086962001-3da4f60e7db5?w=200&h=200&fit=crop',n:'Marble'},{img:'https://images.unsplash.com/photo-1771531072574-af6ed6b954c0?w=200&h=200&fit=crop',n:'Concrete'},{img:'https://images.unsplash.com/photo-1642942552674-8302b1123460?w=200&h=200&fit=crop',n:'Vinyl'},{img:'https://images.unsplash.com/photo-1756361771374-8796aab066da?w=200&h=200&fit=crop',n:'Carpet'}],
                        'Ceiling':[{img:'https://images.unsplash.com/photo-1661533816434-63ee0321ab8f?w=200&h=200&fit=crop',n:'Plaster'},{img:'https://images.unsplash.com/photo-1743228645752-45973135b533?w=200&h=200&fit=crop',n:'Wood'},{img:'https://images.unsplash.com/photo-1551148552-b631bbe476b2?w=200&h=200&fit=crop',n:'Gypsum'},{img:'https://images.unsplash.com/photo-1632324875014-b5713099bef4?w=200&h=200&fit=crop',n:'Concrete'},{img:'https://images.unsplash.com/photo-1758887250669-9ce43c44611d?w=200&h=200&fit=crop',n:'Metal'},{img:'https://images.unsplash.com/photo-1570748494944-9683b21d4521?w=200&h=200&fit=crop',n:'Acoustic Panel'}],
                        'Sofa':[{img:'https://images.unsplash.com/photo-1686806374120-e7ae3f19801d?w=200&h=200&fit=crop',n:'Linen'},{img:'https://images.unsplash.com/photo-1707135109903-535d368cc9e8?w=200&h=200&fit=crop',n:'Velvet'},{img:'https://images.unsplash.com/photo-1771153689015-cfc0db48ae27?w=200&h=200&fit=crop',n:'Leather'},{img:'https://images.unsplash.com/photo-1697247079184-efb23487a172?w=200&h=200&fit=crop',n:'Boucle'},{img:'https://images.unsplash.com/photo-1733145857366-fc99411080b8?w=200&h=200&fit=crop',n:'Cotton'},{img:'https://images.unsplash.com/photo-1657935937312-1ad849214aea?w=200&h=200&fit=crop',n:'Suede'}],
                        'Chair':[{img:'https://images.unsplash.com/photo-1771153689015-cfc0db48ae27?w=200&h=200&fit=crop',n:'Leather'},{img:'https://images.unsplash.com/photo-1771098302185-2d99a6fb2379?w=200&h=200&fit=crop',n:'Fabric'},{img:'https://images.unsplash.com/photo-1683557165720-cc8dd486233c?w=200&h=200&fit=crop',n:'Oak'},{img:'https://images.unsplash.com/photo-1667660664335-f026a2614577?w=200&h=200&fit=crop',n:'Metal'},{img:'https://images.unsplash.com/photo-1707135109903-535d368cc9e8?w=200&h=200&fit=crop',n:'Velvet'},{img:'https://images.unsplash.com/photo-1565672850526-ba956f6fc6fc?w=200&h=200&fit=crop',n:'Rattan'}],
                        'Desk':[{img:'https://images.unsplash.com/photo-1683557165720-cc8dd486233c?w=200&h=200&fit=crop',n:'Oak'},{img:'https://images.unsplash.com/photo-1646006409295-f1b05e7200f5?w=200&h=200&fit=crop',n:'Teak'},{img:'https://images.unsplash.com/photo-1764922200030-ce7748574bb8?w=200&h=200&fit=crop',n:'Walnut'},{img:'https://images.unsplash.com/photo-1667660664335-f026a2614577?w=200&h=200&fit=crop',n:'Metal'},{img:'https://images.unsplash.com/photo-1771795638652-01821921a461?w=200&h=200&fit=crop',n:'Marble Top'},{img:'https://images.unsplash.com/photo-1772992552339-2f43cfa07b9c?w=200&h=200&fit=crop',n:'Glass Top'}],
                        'Table':[{img:'https://images.unsplash.com/photo-1683557165720-cc8dd486233c?w=200&h=200&fit=crop',n:'Oak'},{img:'https://images.unsplash.com/photo-1771795638652-01821921a461?w=200&h=200&fit=crop',n:'Marble'},{img:'https://images.unsplash.com/photo-1761079976271-3a78f547ca67?w=200&h=200&fit=crop',n:'Steel'},{img:'https://images.unsplash.com/photo-1772992552339-2f43cfa07b9c?w=200&h=200&fit=crop',n:'Glass'},{img:'https://images.unsplash.com/photo-1764922200030-ce7748574bb8?w=200&h=200&fit=crop',n:'Walnut'},{img:'https://images.unsplash.com/photo-1632324875014-b5713099bef4?w=200&h=200&fit=crop',n:'Concrete'}],
                        'Cabinet':[{img:'https://images.unsplash.com/photo-1683557165720-cc8dd486233c?w=200&h=200&fit=crop',n:'Oak'},{img:'https://images.unsplash.com/photo-1764922200030-ce7748574bb8?w=200&h=200&fit=crop',n:'Walnut'},{img:'https://images.unsplash.com/photo-1661533816434-63ee0321ab8f?w=200&h=200&fit=crop',n:'Lacquer'},{img:'https://images.unsplash.com/photo-1667660664335-f026a2614577?w=200&h=200&fit=crop',n:'Metal'},{img:'https://images.unsplash.com/photo-1768425245014-2d9855bf4a65?w=200&h=200&fit=crop',n:'Bamboo'},{img:'https://images.unsplash.com/photo-1646006409295-f1b05e7200f5?w=200&h=200&fit=crop',n:'Teak'}],
                        'Door':[{img:'https://images.unsplash.com/photo-1683557165720-cc8dd486233c?w=200&h=200&fit=crop',n:'Oak'},{img:'https://images.unsplash.com/photo-1764922200030-ce7748574bb8?w=200&h=200&fit=crop',n:'Walnut'},{img:'https://images.unsplash.com/photo-1667660664335-f026a2614577?w=200&h=200&fit=crop',n:'Metal'},{img:'https://images.unsplash.com/photo-1772992552339-2f43cfa07b9c?w=200&h=200&fit=crop',n:'Glass Panel'},{img:'https://images.unsplash.com/photo-1661533816434-63ee0321ab8f?w=200&h=200&fit=crop',n:'Painted'},{img:'https://images.unsplash.com/photo-1646006409295-f1b05e7200f5?w=200&h=200&fit=crop',n:'Teak'}],
                        'Window':[{img:'https://images.unsplash.com/photo-1667660664335-f026a2614577?w=200&h=200&fit=crop',n:'Aluminium'},{img:'https://images.unsplash.com/photo-1683557165720-cc8dd486233c?w=200&h=200&fit=crop',n:'Wood Frame'},{img:'https://images.unsplash.com/photo-1761079976271-3a78f547ca67?w=200&h=200&fit=crop',n:'Steel Frame'},{img:'https://images.unsplash.com/photo-1772992552339-2f43cfa07b9c?w=200&h=200&fit=crop',n:'Clear Glass'},{img:'https://images.unsplash.com/photo-1596902362438-e8516a972fb5?w=200&h=200&fit=crop',n:'Tinted Glass'},{img:'https://images.unsplash.com/photo-1632324875014-b5713099bef4?w=200&h=200&fit=crop',n:'UPVC'}],
                        'Glass':[{img:'https://images.unsplash.com/photo-1772992552339-2f43cfa07b9c?w=200&h=200&fit=crop',n:'Clear'},{img:'https://images.unsplash.com/photo-1596902362438-e8516a972fb5?w=200&h=200&fit=crop',n:'Tinted'},{img:'https://images.unsplash.com/photo-1551148552-b631bbe476b2?w=200&h=200&fit=crop',n:'Frosted'},{img:'https://images.unsplash.com/photo-1763965780173-a94955ed16c7?w=200&h=200&fit=crop',n:'Textured'},{img:'https://images.unsplash.com/photo-1648583189779-536c76a17957?w=200&h=200&fit=crop',n:'Wire Mesh'},{img:'https://images.unsplash.com/photo-1771795638652-01821921a461?w=200&h=200&fit=crop',n:'Etched'}],
                        'Partition':[{img:'https://images.unsplash.com/photo-1772992552339-2f43cfa07b9c?w=200&h=200&fit=crop',n:'Glass'},{img:'https://images.unsplash.com/photo-1683557165720-cc8dd486233c?w=200&h=200&fit=crop',n:'Wood'},{img:'https://images.unsplash.com/photo-1667660664335-f026a2614577?w=200&h=200&fit=crop',n:'Metal'},{img:'https://images.unsplash.com/photo-1771098302185-2d99a6fb2379?w=200&h=200&fit=crop',n:'Fabric'},{img:'https://images.unsplash.com/photo-1565672850526-ba956f6fc6fc?w=200&h=200&fit=crop',n:'Rattan'},{img:'https://images.unsplash.com/photo-1661533816434-63ee0321ab8f?w=200&h=200&fit=crop',n:'Plaster'}],
                        'Carpet':[{img:'https://images.unsplash.com/photo-1600166898405-3aad6191b57b?w=200&h=200&fit=crop',n:'Wool'},{img:'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=200&h=200&fit=crop',n:'Jute'},{img:'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=200&h=200&fit=crop',n:'Cotton'},{img:'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=200&h=200&fit=crop',n:'Silk Blend'},{img:'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200&h=200&fit=crop',n:'Shag'},{img:'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=200&h=200&fit=crop',n:'Flatweave'}],
                        'Decor':[{img:'https://images.unsplash.com/photo-1572596116404-98f227c01ac1?w=200&h=200&fit=crop',n:'Ceramic'},{img:'https://images.unsplash.com/photo-1667660664335-f026a2614577?w=200&h=200&fit=crop',n:'Metal'},{img:'https://images.unsplash.com/photo-1772992552339-2f43cfa07b9c?w=200&h=200&fit=crop',n:'Glass'},{img:'https://images.unsplash.com/photo-1750791007759-ae174e1e63cf?w=200&h=200&fit=crop',n:'Stone'},{img:'https://images.unsplash.com/photo-1683557165720-cc8dd486233c?w=200&h=200&fit=crop',n:'Wood'},{img:'https://images.unsplash.com/photo-1565672850526-ba956f6fc6fc?w=200&h=200&fit=crop',n:'Rattan'}],'Lighting':[{img:'https://images.unsplash.com/photo-1667660664335-f026a2614577?w=200&h=200&fit=crop',n:'Brushed Metal'},{img:'https://images.unsplash.com/photo-1772992552339-2f43cfa07b9c?w=200&h=200&fit=crop',n:'Glass'},{img:'https://images.unsplash.com/photo-1572596116404-98f227c01ac1?w=200&h=200&fit=crop',n:'Ceramic Base'},{img:'https://images.unsplash.com/photo-1771098302185-2d99a6fb2379?w=200&h=200&fit=crop',n:'Fabric Shade'},{img:'https://images.unsplash.com/photo-1683557165720-cc8dd486233c?w=200&h=200&fit=crop',n:'Wood Accent'},{img:'https://images.unsplash.com/photo-1771795638652-01821921a461?w=200&h=200&fit=crop',n:'Marble Base'}],
                      } as Record<string,{img:string,n:string}[]>)[replaceSelectedCategory] || []).map((sw, i) => (
                        <div key={i} style={{ cursor: 'pointer' }} onClick={() => { setReplaceSelectedMaterial(sw.n); setReplaceSelectedMaterialImageUrl(sw.img); }}>
                          <div style={{ width: 100, height: 100, borderRadius: 8, overflow: 'hidden', border: replaceSelectedMaterial === sw.n ? '1.5px solid #ffffff' : '1.5px solid transparent', transition: 'border-color 150ms ease' }}>
                            <img src={sw.img} alt={sw.n} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          </div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 4 }}>{sw.n}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '20px 16px', fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                    Pick an object category on the left to choose style, colour, and material.
                  </div>
                )}
              </div>
              <div style={{ padding: '8px 16px 0', display: 'flex', flexWrap: 'nowrap', gap: '8px', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setRepShowUploadModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.28)',
                    borderRadius: 999,
                    padding: '4px 10px',
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.92)',
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                  title="Upload reference image"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L6 21" />
                    <path d="m14 19.5 3-3 3 3" />
                    <path d="M17 22v-5.5" />
                    <circle cx="9" cy="9" r="2" />
                  </svg>
                  <span>Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReplaceSubPanel('generatePrompt')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.28)',
                    borderRadius: 999,
                    padding: '4px 10px',
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.92)',
                    cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                  title="Use text prompt"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M12 4v16" />
                    <path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2" />
                    <path d="M9 20h6" />
                  </svg>
                  <span>Text prompt</span>
                </button>
              </div>
              <div style={{ padding: isMobile ? '12px 16px 96px' : '12px 16px 16px', flexShrink: 0 }}>
                <button
                  type="button"
                  disabled={replaceCatalogToImageDisabled}
                  onClick={() => {
                    if (isMobile) setMobileRightPanelOpen(false);
                    void handleReplaceApply();
                  }}
                  style={{
                    width: '100%',
                    height: '44px',
                    borderRadius: '8px',
                    background: '#000000',
                    border: '1.5px solid #FFFFFF',
                    cursor: replaceCatalogToImageDisabled ? 'not-allowed' : 'pointer',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#FFFFFF',
                    letterSpacing: '-0.1px',
                    transition: 'all 180ms ease',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.22)',
                    opacity: replaceCatalogToImageDisabled ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (replaceCatalogToImageDisabled) return;
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.85)';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.32)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#000000';
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.22)';
                  }}
                >
                  {apiGenerating && apiGenerateKind === 'replace' ? 'Replacing…' : 'Replace in Image'}
                </button>
              </div>
            </div>
            {/* Replace — Uploaded Component panel */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'clip', background: 'rgba(0,0,0,0.22)', zIndex: 3, opacity: replaceSubPanel === 'uploadedComponent' ? 1 : 0, transform: replaceSubPanel === 'uploadedComponent' ? 'translateX(0)' : 'translateX(100%)', transition: 'opacity 250ms ease, transform 250ms ease', pointerEvents: replaceSubPanel === 'uploadedComponent' ? 'auto' : 'none' }}>
              <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div onClick={() => { setReplaceSubPanel(null); setRepConfirmedUploadImages([]); setRepUploadedImages([null, null, null]); setRepUploadedCompColour(null); }} style={{ width: 16, height: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#ffffff' }}>Uploaded Component</span>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', paddingBottom: 8, scrollbarWidth: 'none' } as React.CSSProperties}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', padding: '12px 16px 8px' }}>Uploaded Images</div>
                <div style={{ padding: '0 16px', boxSizing: 'border-box' }}>
                  <div onScroll={(e) => { const el = e.currentTarget; const itemW = el.clientWidth; const idx = Math.round(el.scrollLeft / (itemW + 10)); setRepUploadedImgIdx(idx); }} style={{ display: 'flex', flexDirection: 'row', overflowX: 'auto', scrollSnapType: 'x mandatory', gap: 10, paddingBottom: 8, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollPaddingLeft: 0 } as React.CSSProperties}>
                    {repConfirmedUploadImages.map((img, idx) => (
                      <div key={idx} style={{ flexShrink: 0, width: '100%', scrollSnapAlign: 'start' }}>
                        <img src={img} alt={`Image ${idx + 1}`} style={{ borderRadius: 10, height: 160, objectFit: 'cover', border: '0.5px solid rgba(255,255,255,0.1)', width: '100%', display: 'block' }} />
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 6, flexShrink: 0 }}>Image {idx + 1}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {repConfirmedUploadImages.length > 1 && (
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8 }}>
                    {repConfirmedUploadImages.map((_, idx) => (
                      <div key={idx} style={{ width: 5, height: 5, borderRadius: '50%', background: idx === repUploadedImgIdx ? '#ffffff' : 'rgba(255,255,255,0.3)', transition: 'background 200ms ease' }} />
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', padding: '14px 16px 6px' }}>Details</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, padding: '0 16px 16px' }}>
                  AI will replace the selected area with this component using your uploaded reference images and chosen colour.
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '10px 16px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px 16px' }}>
                  {[
                    { label: 'Width', value: '82 cm' },
                    { label: 'Depth', value: '74 cm' },
                    { label: 'Height', value: '78 cm' },
                    { label: 'Weight', value: '12 kg' },
                    { label: 'Material', value: 'Fabric / Metal' },
                    { label: 'Fit for', value: 'Living Room' },
                  ].map((spec) => (
                    <div key={spec.label} style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{spec.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{spec.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ flexShrink: 0, padding: '8px 16px', display: 'block' }}>
                <button onClick={handlePlaceComponent} disabled={placingComponent || apiGenerating || externalGeneratePending || !roomSession} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: '#ffffff', fontSize: 13, fontWeight: 500, width: '100%', borderRadius: 8, height: 40, cursor: placingComponent || apiGenerating || externalGeneratePending || !roomSession ? 'default' : 'pointer', fontFamily: "'Inter', sans-serif", transition: 'background 150ms ease, opacity 150ms ease', opacity: placingComponent || apiGenerating || externalGeneratePending || !roomSession ? 0.4 : 1 }}
                  onMouseEnter={e => { if (!placingComponent && !apiGenerating && !externalGeneratePending && roomSession) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
                >{apiGenerating && apiGenerateKind === 'replace' ? 'Replacing…' : 'Replace in Image'}</button>
              </div>
            </div>
            {/* Replace — Generate Replacement panel */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(0,0,0,0.22)', zIndex: 3, opacity: replaceSubPanel === 'generatePrompt' ? 1 : 0, transform: replaceSubPanel === 'generatePrompt' ? 'translateX(0)' : 'translateX(100%)', transition: 'opacity 250ms ease, transform 250ms ease', pointerEvents: replaceSubPanel === 'generatePrompt' ? 'auto' : 'none' }}>
              <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div onClick={() => { setReplaceSubPanel(null); setRepPromptText(''); setRepGeneratedPreview(false); setRepGenerating(false); setRepGenerateScanning(false); }} style={{ width: 16, height: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8L10 13" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#ffffff' }}>Generate Replacement</div>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
              <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', padding: '12px 16px 6px' }}>Guidelines</div>
                {['Be specific about style, material and colour', 'Mention the room context e.g. living room', 'Include size hints e.g. large, compact', 'Avoid vague terms like nice or modern'].map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '0 16px', lineHeight: 1.8 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', flexShrink: 0, marginTop: 7 }} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{t}</span>
                  </div>
                ))}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 16px' }} />
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', padding: '12px 16px 6px' }}>Your Prompt</div>
                <textarea
                  ref={repGenerateTextareaRef}
                  value={repPromptText}
                  onChange={e => { if (e.target.value.length <= 300) setRepPromptText(e.target.value); }}
                  placeholder="e.g. A compact velvet armchair in deep emerald green with gold legs, mid-century style..."
                  style={{ width: 'calc(100% - 32px)', margin: '0 16px', minHeight: 100, background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 12, fontSize: 12, color: '#ffffff', resize: 'none', fontFamily: "'Inter', sans-serif", outline: 'none' }}
                />
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '4px 16px 0', textAlign: 'right' }}>{repPromptText.length} / 300</div>
                {!repGeneratedPreview && !repGenerateScanning && (
                  <div style={{ padding: '0 16px', marginTop: 12 }}>
                    <button
                      disabled={!repPromptText.trim() || repGenerating || apiGenerating}
                      onClick={() => {
                        if (!repPromptText.trim() || repGenerating || apiGenerating) return;
                        setRepGenerating(true);
                        setRepGeneratedPreview(false);
                        setRepGenerateScanning(false);
                        setTimeout(() => {
                          setRepGenerating(false);
                          setRepGenerateScanning(true);
                          setTimeout(() => {
                            setRepGenerateScanning(false);
                            setRepGeneratedPreview(true);
                          }, 1500);
                        }, 400);
                      }}
                      style={{ width: '100%', height: 40, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: '#ffffff', fontSize: 13, fontWeight: 500, borderRadius: 8, cursor: (repPromptText.trim() && !repGenerating && !apiGenerating) ? 'pointer' : 'default', fontFamily: "'Inter', sans-serif", transition: 'background 150ms ease, opacity 150ms ease', opacity: (repPromptText.trim() && !repGenerating && !apiGenerating) ? 1 : 0.4 }}
                      onMouseEnter={e => { if (repPromptText.trim() && !repGenerating && !apiGenerating) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
                    >
                      {repGenerating ? 'Generating...' : 'Generate Replacement'}
                    </button>
                  </div>
                )}
                {!repGeneratedPreview && !repGenerateScanning && repPromptText.trim() && (
                  <div style={{ padding: '12px 16px 0' }}>
                    <button
                      type="button"
                      onClick={handlePlaceComponent}
                      disabled={placingComponent || apiGenerating || externalGeneratePending || !roomSession}
                      style={{ width: '100%', height: 40, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.35)', color: '#ffffff', fontSize: 13, fontWeight: 500, borderRadius: 8, cursor: placingComponent || apiGenerating || externalGeneratePending || !roomSession ? 'default' : 'pointer', fontFamily: "'Inter', sans-serif", transition: 'background 150ms ease, opacity 150ms ease', opacity: placingComponent || apiGenerating || externalGeneratePending || !roomSession ? 0.45 : 1 }}
                      onMouseEnter={e => { if (!placingComponent && !apiGenerating && !externalGeneratePending && roomSession) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.2)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)'; }}
                    >
                      {apiGenerating && apiGenerateKind === 'replace' ? 'Replacing…' : 'Replace in Image (use prompt)'}
                    </button>
                  </div>
                )}
                {(repGenerateScanning || repGeneratedPreview) && (
                  <>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', padding: '12px 16px 4px' }}>Generated Preview</div>
                    <div style={{ width: 'calc(100% - 32px)', margin: '0 16px', aspectRatio: '1 / 1', borderRadius: 10, border: '0.5px solid rgba(255,255,255,0.1)', background: '#000', overflow: 'hidden', position: 'relative' }}>
                      {repGenerateScanning ? (
                        <div style={{ position: 'absolute', inset: 0 }}>
                          <style>{`@keyframes repScanSweep { 0% { transform: translate(-100%, -100%) rotate(45deg); } 100% { transform: translate(100%, 100%) rotate(45deg); } }`}</style>
                          {Array.from({ length: 12 }).map((_, row) =>
                            Array.from({ length: 12 }).map((_, col) => (
                              <div key={`${row}-${col}`} style={{ position: 'absolute', left: `${(col / 12) * 100}%`, top: `${(row / 12) * 100}%`, width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.15)' }} />
                            ))
                          )}
                          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', width: '200%', height: '40%', background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.12) 60%, transparent 100%)', animation: 'repScanSweep 1.5s ease-in-out forwards' }} />
                          </div>
                        </div>
                      ) : (
                        <img src="https://images.unsplash.com/photo-1571977796766-578d484a6c25?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbWVyYWxkJTIwZ3JlZW4lMjB2ZWx2ZXQlMjBhcm1jaGFpciUyMGdvbGQlMjBsZWdzfGVufDF8fHx8MTc3NDM1NjMyNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" alt="Generated replacement" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      )}
                    </div>
                    {repGeneratedPreview && (
                      <>
                        <div style={{ padding: '8px 16px 4px' }}>
                          <button
                            onClick={() => { setRepGeneratedPreview(false); setRepGenerateScanning(false); setTimeout(() => repGenerateTextareaRef.current?.focus(), 50); }}
                            style={{ width: '100%', height: 40, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 500, borderRadius: 8, cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'background 150ms ease, color 150ms ease' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLButtonElement).style.color = '#ffffff'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.75)'; }}
                          >Rewrite Prompt</button>
                        </div>
                        <div style={{ padding: '4px 16px 16px' }}>
                          <button type="button" onClick={handlePlaceComponent} disabled={placingComponent || apiGenerating || externalGeneratePending || !roomSession} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: '#ffffff', fontSize: 13, fontWeight: 500, width: '100%', borderRadius: 8, height: 40, cursor: placingComponent || apiGenerating || externalGeneratePending || !roomSession ? 'default' : 'pointer', fontFamily: "'Inter', sans-serif", transition: 'background 150ms ease, opacity 150ms ease', opacity: placingComponent || apiGenerating || externalGeneratePending || !roomSession ? 0.4 : 1 }}
                            onMouseEnter={e => { if (!placingComponent && !apiGenerating && !externalGeneratePending && roomSession) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'; }}
                          >{apiGenerating && apiGenerateKind === 'replace' ? 'Replacing…' : 'Replace in Image'}</button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ) : isCustomisation ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
            {/* Tab switcher */}
            <div style={{ padding: '12px 16px 0', borderBottom: '0.5px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'row' }}>
              {(['Style', 'Colour', 'Material'] as const).map(tab => {
                const isActive = customPanelTab === tab;
                return (
                  <div
                    key={tab}
                    onClick={() => setCustomPanelTab(tab)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      paddingBottom: '10px',
                      position: 'relative',
                    }}
                  >
                    <span style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '13px',
                      fontWeight: isActive ? 500 : 400,
                      color: isActive ? '#ffffff' : 'rgba(255,255,255,0.4)',
                      transition: 'color 200ms ease',
                      userSelect: 'none',
                    }}>
                      {tab}
                    </span>
                    <div style={{ position: 'absolute', bottom: '-0.5px', left: '50%', transform: 'translateX(-50%)', height: '2px', background: '#ffffff', borderRadius: '1px', opacity: isActive ? 1 : 0, transition: 'opacity 200ms ease' }}>
                      <span style={{ visibility: 'hidden', fontSize: '13px', fontWeight: 500, fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap' }}>{tab}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Content area */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              {customPanelTab === 'Style' && selectedCategory ? (
                <div style={{ fontFamily: "'Inter', sans-serif" }}>
                  <div style={{ padding: '12px 16px 8px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                    {selectedCategory} — Select Style
                    {customActiveTab === 'Edit' && (selectedCategory === 'Wall' || selectedCategory === 'Floor') && editMytylesTiles.length > 0 && (
                      <span style={{ marginLeft: 6, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>(Mytyles)</span>
                    )}
                    {customActiveTab === 'Edit' && selectedCategory === 'Sofa' && editSofaProducts.length > 0 && (
                      <span style={{ marginLeft: 6, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>(catalog)</span>
                    )}
                    {customActiveTab === 'Edit' &&
                      (selectedCategory === 'Chair' ||
                        selectedCategory === 'Bed' ||
                        selectedCategory === 'Mattress' ||
                        selectedCategory === 'Table' ||
                        selectedCategory === 'Dining' ||
                        selectedCategory === 'Cabinet' ||
                        selectedCategory === 'Carpet') &&
                      ((selectedCategory === 'Chair' && editChairProducts.length > 0) ||
                        (selectedCategory === 'Bed' && editBedProducts.length > 0) ||
                        (selectedCategory === 'Mattress' && editMattressProducts.length > 0) ||
                        (selectedCategory === 'Table' && editTableProducts.length > 0) ||
                        (selectedCategory === 'Dining' && editDiningProducts.length > 0) ||
                        (selectedCategory === 'Cabinet' && editCabinetProducts.length > 0) ||
                        (selectedCategory === 'Carpet' && editCarpetProducts.length > 0)) && (
                      <span style={{ marginLeft: 6, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>(catalog)</span>
                    )}
                    {customActiveTab === 'Edit' && selectedCategory === 'Lighting' && editLightingProducts.length > 0 && (
                      <span style={{ marginLeft: 6, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>(catalog)</span>
                    )}
                    {customActiveTab === 'Edit' && selectedCategory === 'Decor' && editDecorProducts.length > 0 && (
                      <span style={{ marginLeft: 6, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>(catalog)</span>
                    )}
                  </div>
                  {customActiveTab === 'Edit' && (selectedCategory === 'Wall' || selectedCategory === 'Floor') && editMytylesLoading && (
                    <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading vitrified tiles from Supabase…</div>
                  )}
                  {customActiveTab === 'Edit' && selectedCategory === 'Sofa' && editSofaLoading && (
                    <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading sofas from catalog…</div>
                  )}
                  {customActiveTab === 'Edit' && selectedCategory === 'Chair' && editChairLoading && (
                    <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading chairs from catalog…</div>
                  )}
                  {customActiveTab === 'Edit' && selectedCategory === 'Bed' && editBedLoading && (
                    <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading beds from catalog…</div>
                  )}
                  {customActiveTab === 'Edit' && selectedCategory === 'Mattress' && editMattressLoading && (
                    <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading mattresses from catalog…</div>
                  )}
                  {customActiveTab === 'Edit' && selectedCategory === 'Table' && editTableLoading && (
                    <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading tables from catalog…</div>
                  )}
                  {customActiveTab === 'Edit' && selectedCategory === 'Dining' && editDiningLoading && (
                    <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading dining from catalog…</div>
                  )}
                  {customActiveTab === 'Edit' && selectedCategory === 'Cabinet' && editCabinetLoading && (
                    <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading cabinets / storage from catalog…</div>
                  )}
                  {customActiveTab === 'Edit' && selectedCategory === 'Carpet' && editCarpetLoading && (
                    <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading carpets / rugs from catalog…</div>
                  )}
                  {customActiveTab === 'Edit' && selectedCategory === 'Lighting' && editLightingLoading && (
                    <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading lighting from catalog…</div>
                  )}
                  {customActiveTab === 'Edit' && selectedCategory === 'Decor' && editDecorLoading && (
                    <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,255,255,0.42)', lineHeight: 1.45 }}>Loading decor from catalog…</div>
                  )}
                  {customActiveTab === 'Edit' && (selectedCategory === 'Wall' || selectedCategory === 'Floor') && editMytylesError && editMytylesTiles.length === 0 && (
                    <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editMytylesError}</div>
                  )}
                  {customActiveTab === 'Edit' && selectedCategory === 'Sofa' && editSofaError && editSofaProducts.length === 0 && (
                    <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editSofaError}</div>
                  )}
                  {customActiveTab === 'Edit' && selectedCategory === 'Chair' && editChairError && editChairProducts.length === 0 && (
                    <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editChairError}</div>
                  )}
                  {customActiveTab === 'Edit' && selectedCategory === 'Bed' && editBedError && editBedProducts.length === 0 && (
                    <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editBedError}</div>
                  )}
                  {customActiveTab === 'Edit' && selectedCategory === 'Mattress' && editMattressError && editMattressProducts.length === 0 && (
                    <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editMattressError}</div>
                  )}
                  {customActiveTab === 'Edit' && selectedCategory === 'Table' && editTableError && editTableProducts.length === 0 && (
                    <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editTableError}</div>
                  )}
                  {customActiveTab === 'Edit' && selectedCategory === 'Dining' && editDiningError && editDiningProducts.length === 0 && (
                    <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editDiningError}</div>
                  )}
                  {customActiveTab === 'Edit' && selectedCategory === 'Cabinet' && editCabinetError && editCabinetProducts.length === 0 && (
                    <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editCabinetError}</div>
                  )}
                  {customActiveTab === 'Edit' && selectedCategory === 'Carpet' && editCarpetError && editCarpetProducts.length === 0 && (
                    <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editCarpetError}</div>
                  )}
                  {customActiveTab === 'Edit' && selectedCategory === 'Lighting' && editLightingError && editLightingProducts.length === 0 && (
                    <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editLightingError}</div>
                  )}
                  {customActiveTab === 'Edit' && selectedCategory === 'Decor' && editDecorError && editDecorProducts.length === 0 && (
                    <div style={{ padding: '8px 16px 0', fontSize: 10, color: 'rgba(255,180,180,0.8)', lineHeight: 1.45 }}>{editDecorError}</div>
                  )}
                  <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {catalogStyleSwatchRows.map((sw) => (
                      <div key={sw.k} style={{ cursor: 'pointer' }} title={sw.title} onClick={() => setSelectedStyleSwatch(sw.k)}>
                        <div style={{ width: 100, height: 100, borderRadius: 8, overflow: 'hidden', border: selectedStyleSwatch === sw.k ? '1.5px solid #ffffff' : '1.5px solid transparent', transition: 'border-color 150ms ease' }}>
                          <img src={sw.img} alt={sw.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 4, lineHeight: 1.35 }}>{sw.n}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : customPanelTab === 'Colour' && selectedCategory ? (
                <div style={{ fontFamily: "'Inter', sans-serif" }}>
                  <div style={{ padding: '12px 16px 8px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                    {selectedCategory} — Select Colour
                  </div>
                  <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {(({
                      'Wall':[{c:'#F5F0E0',n:'Warm White'},{c:'#D4C9A8',n:'Sand Beige'},{c:'#8BAE8B',n:'Sage Green'},{c:'#6B7B8D',n:'Slate Grey'},{c:'#C4704A',n:'Terracotta'},{c:'#2C3E6B',n:'Navy Blue'}],
                      'Floor':[{c:'#A0785A',n:'Warm Oak'},{c:'#D4C9B0',n:'Light Maple'},{c:'#5A4030',n:'Dark Walnut'},{c:'#C8B89A',n:'Natural Birch'},{c:'#8B8B8B',n:'Concrete Grey'},{c:'#E8DDD0',n:'Ivory Tile'}],
                      'Ceiling':[{c:'#FFFFFF',n:'Pure White'},{c:'#F5F0E8',n:'Soft Cream'},{c:'#E8E0D0',n:'Warm Ivory'},{c:'#D0D0D0',n:'Light Grey'},{c:'#C8D8D8',n:'Sky Mist'},{c:'#F0E8D8',n:'Antique White'}],
                      'Sofa':[{c:'#4A6B8A',n:'Steel Blue'},{c:'#8B6B50',n:'Camel Brown'},{c:'#505050',n:'Charcoal'},{c:'#C4956A',n:'Tan Leather'},{c:'#6B8B6B',n:'Olive Green'},{c:'#D4C9B0',n:'Cream'}],
                      'Chair':[{c:'#2C2C2C',n:'Matte Black'},{c:'#C8B89A',n:'Light Wood'},{c:'#6B5B45',n:'Walnut'},{c:'#E0E0E0',n:'White'},{c:'#8B4040',n:'Burgundy'},{c:'#4A6B5A',n:'Forest Green'}],
                      'Desk':[{c:'#A0785A',n:'Natural Oak'},{c:'#3A3A3A',n:'Black'},{c:'#FFFFFF',n:'White Gloss'},{c:'#5A4030',n:'Dark Walnut'},{c:'#B0A090',n:'Ash Grey'}],
                      'Table':[{c:'#8B7355',n:'Rustic Wood'},{c:'#2C2C2C',n:'Black Metal'},{c:'#E0D8C8',n:'White Oak'},{c:'#C0C0C0',n:'Brushed Steel'},{c:'#5A4030',n:'Espresso'},{c:'#D4C0A0',n:'Natural Pine'}],
                      'Cabinet':[{c:'#FFFFFF',n:'White'},{c:'#4A5A6A',n:'Navy Blue'},{c:'#6B5B45',n:'Walnut'},{c:'#8B8B7B',n:'Sage'},{c:'#2C2C2C',n:'Matte Black'},{c:'#C8B89A',n:'Light Oak'}],
                      'Door':[{c:'#FFFFFF',n:'White'},{c:'#8B7355',n:'Oak'},{c:'#3A3A3A',n:'Charcoal'},{c:'#5A4030',n:'Mahogany'},{c:'#B0A090',n:'Grey Wash'},{c:'#2C4A2C',n:'Forest Green'}],
                      'Window':[{c:'#2C2C2C',n:'Black Frame'},{c:'#FFFFFF',n:'White Frame'},{c:'#8B7355',n:'Oak Frame'},{c:'#808080',n:'Grey Frame'},{c:'#C4956A',n:'Bronze Frame'}],
                      'Glass':[{c:'#E8F4F8',n:'Clear'},{c:'#D0E8E0',n:'Frosted Green'},{c:'#D8D8E0',n:'Smoked Grey'},{c:'#D0E0F0',n:'Blue Tint'},{c:'#F0E8D0',n:'Amber Tint'},{c:'#E0E0E0',n:'Frosted White'}],
                      'Partition':[{c:'#FFFFFF',n:'White'},{c:'#C8B89A',n:'Light Wood'},{c:'#2C2C2C',n:'Black'},{c:'#D0D0D0',n:'Light Grey'},{c:'#8B7B6B',n:'Warm Taupe'}],
                      'Carpet':[{c:'#A0785A',n:'Warm Beige'},{c:'#6B5344',n:'Chocolate'},{c:'#2C2C2C',n:'Charcoal'},{c:'#C4A574',n:'Sand'},{c:'#8B4040',n:'Burgundy'},{c:'#4A5D4A',n:'Sage'}],
                      'Decor':[{c:'#C4956A',n:'Brass Gold'},{c:'#2C2C2C',n:'Matte Black'},{c:'#FFFFFF',n:'Ceramic White'},{c:'#8BAE8B',n:'Sage Green'},{c:'#C4704A',n:'Terracotta'},{c:'#4A6B8A',n:'Ocean Blue'}],'Lighting':[{c:'#FFF8E8',n:'Warm White'},{c:'#E8F0FF',n:'Cool White'},{c:'#C9A227',n:'Brass'},{c:'#2C2C2C',n:'Matte Black'},{c:'#C0C4C8',n:'Brushed Nickel'},{c:'#F5E6D3',n:'Ivory Shade'}],
                    } as Record<string,{c:string,n:string}[]>)[selectedCategory] || []).map((sw, i) => (
                      <div key={i} style={{ cursor: 'pointer' }} onClick={() => setSelectedColorDots([sw.c])}>
                        <div style={{ width: 100, height: 100, borderRadius: 8, background: sw.c, border: selectedColorDots?.[0] === sw.c ? '1.5px solid #ffffff' : '1.5px solid transparent', transition: 'border-color 150ms ease' }} />
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 4 }}>{sw.n}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : customPanelTab === 'Material' && selectedCategory ? (
                <div style={{ fontFamily: "'Inter', sans-serif" }}>
                  <div style={{ padding: '12px 16px 8px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                    {selectedCategory} — Select Material
                  </div>
                  <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {(({
                      'Wall':[{img:'https://images.unsplash.com/photo-1661533816434-63ee0321ab8f?w=200&h=200&fit=crop',n:'Plaster'},{img:'https://images.unsplash.com/photo-1677993780799-fb17d314336a?w=200&h=200&fit=crop',n:'Brick'},{img:'https://images.unsplash.com/photo-1771795638652-01821921a461?w=200&h=200&fit=crop',n:'Marble'},{img:'https://images.unsplash.com/photo-1632324875014-b5713099bef4?w=200&h=200&fit=crop',n:'Concrete'},{img:'https://images.unsplash.com/photo-1691941896284-708ae594a8ce?w=200&h=200&fit=crop',n:'Wallpaper'},{img:'https://images.unsplash.com/photo-1630365037039-e5aeca9579d1?w=200&h=200&fit=crop',n:'Wood Panel'}],
                      'Floor':[{img:'https://images.unsplash.com/photo-1711915442858-2a5bb7ba67d8?w=200&h=200&fit=crop',n:'Hardwood'},{img:'https://images.unsplash.com/photo-1695191388218-f6259600223f?w=200&h=200&fit=crop',n:'Tile'},{img:'https://images.unsplash.com/photo-1770086962001-3da4f60e7db5?w=200&h=200&fit=crop',n:'Marble'},{img:'https://images.unsplash.com/photo-1771531072574-af6ed6b954c0?w=200&h=200&fit=crop',n:'Concrete'},{img:'https://images.unsplash.com/photo-1642942552674-8302b1123460?w=200&h=200&fit=crop',n:'Vinyl'},{img:'https://images.unsplash.com/photo-1756361771374-8796aab066da?w=200&h=200&fit=crop',n:'Carpet'}],
                      'Ceiling':[{img:'https://images.unsplash.com/photo-1661533816434-63ee0321ab8f?w=200&h=200&fit=crop',n:'Plaster'},{img:'https://images.unsplash.com/photo-1743228645752-45973135b533?w=200&h=200&fit=crop',n:'Wood'},{img:'https://images.unsplash.com/photo-1551148552-b631bbe476b2?w=200&h=200&fit=crop',n:'Gypsum'},{img:'https://images.unsplash.com/photo-1632324875014-b5713099bef4?w=200&h=200&fit=crop',n:'Concrete'},{img:'https://images.unsplash.com/photo-1758887250669-9ce43c44611d?w=200&h=200&fit=crop',n:'Metal'},{img:'https://images.unsplash.com/photo-1570748494944-9683b21d4521?w=200&h=200&fit=crop',n:'Acoustic Panel'}],
                      'Sofa':[{img:'https://images.unsplash.com/photo-1686806374120-e7ae3f19801d?w=200&h=200&fit=crop',n:'Linen'},{img:'https://images.unsplash.com/photo-1707135109903-535d368cc9e8?w=200&h=200&fit=crop',n:'Velvet'},{img:'https://images.unsplash.com/photo-1771153689015-cfc0db48ae27?w=200&h=200&fit=crop',n:'Leather'},{img:'https://images.unsplash.com/photo-1697247079184-efb23487a172?w=200&h=200&fit=crop',n:'Boucle'},{img:'https://images.unsplash.com/photo-1733145857366-fc99411080b8?w=200&h=200&fit=crop',n:'Cotton'},{img:'https://images.unsplash.com/photo-1657935937312-1ad849214aea?w=200&h=200&fit=crop',n:'Suede'}],
                      'Chair':[{img:'https://images.unsplash.com/photo-1771153689015-cfc0db48ae27?w=200&h=200&fit=crop',n:'Leather'},{img:'https://images.unsplash.com/photo-1771098302185-2d99a6fb2379?w=200&h=200&fit=crop',n:'Fabric'},{img:'https://images.unsplash.com/photo-1683557165720-cc8dd486233c?w=200&h=200&fit=crop',n:'Oak'},{img:'https://images.unsplash.com/photo-1667660664335-f026a2614577?w=200&h=200&fit=crop',n:'Metal'},{img:'https://images.unsplash.com/photo-1707135109903-535d368cc9e8?w=200&h=200&fit=crop',n:'Velvet'},{img:'https://images.unsplash.com/photo-1565672850526-ba956f6fc6fc?w=200&h=200&fit=crop',n:'Rattan'}],
                      'Desk':[{img:'https://images.unsplash.com/photo-1683557165720-cc8dd486233c?w=200&h=200&fit=crop',n:'Oak'},{img:'https://images.unsplash.com/photo-1646006409295-f1b05e7200f5?w=200&h=200&fit=crop',n:'Teak'},{img:'https://images.unsplash.com/photo-1764922200030-ce7748574bb8?w=200&h=200&fit=crop',n:'Walnut'},{img:'https://images.unsplash.com/photo-1667660664335-f026a2614577?w=200&h=200&fit=crop',n:'Metal'},{img:'https://images.unsplash.com/photo-1771795638652-01821921a461?w=200&h=200&fit=crop',n:'Marble Top'},{img:'https://images.unsplash.com/photo-1772992552339-2f43cfa07b9c?w=200&h=200&fit=crop',n:'Glass Top'}],
                      'Table':[{img:'https://images.unsplash.com/photo-1683557165720-cc8dd486233c?w=200&h=200&fit=crop',n:'Oak'},{img:'https://images.unsplash.com/photo-1771795638652-01821921a461?w=200&h=200&fit=crop',n:'Marble'},{img:'https://images.unsplash.com/photo-1761079976271-3a78f547ca67?w=200&h=200&fit=crop',n:'Steel'},{img:'https://images.unsplash.com/photo-1772992552339-2f43cfa07b9c?w=200&h=200&fit=crop',n:'Glass'},{img:'https://images.unsplash.com/photo-1764922200030-ce7748574bb8?w=200&h=200&fit=crop',n:'Walnut'},{img:'https://images.unsplash.com/photo-1632324875014-b5713099bef4?w=200&h=200&fit=crop',n:'Concrete'}],
                      'Cabinet':[{img:'https://images.unsplash.com/photo-1683557165720-cc8dd486233c?w=200&h=200&fit=crop',n:'Oak'},{img:'https://images.unsplash.com/photo-1764922200030-ce7748574bb8?w=200&h=200&fit=crop',n:'Walnut'},{img:'https://images.unsplash.com/photo-1661533816434-63ee0321ab8f?w=200&h=200&fit=crop',n:'Lacquer'},{img:'https://images.unsplash.com/photo-1667660664335-f026a2614577?w=200&h=200&fit=crop',n:'Metal'},{img:'https://images.unsplash.com/photo-1768425245014-2d9855bf4a65?w=200&h=200&fit=crop',n:'Bamboo'},{img:'https://images.unsplash.com/photo-1646006409295-f1b05e7200f5?w=200&h=200&fit=crop',n:'Teak'}],
                      'Door':[{img:'https://images.unsplash.com/photo-1683557165720-cc8dd486233c?w=200&h=200&fit=crop',n:'Oak'},{img:'https://images.unsplash.com/photo-1764922200030-ce7748574bb8?w=200&h=200&fit=crop',n:'Walnut'},{img:'https://images.unsplash.com/photo-1667660664335-f026a2614577?w=200&h=200&fit=crop',n:'Metal'},{img:'https://images.unsplash.com/photo-1772992552339-2f43cfa07b9c?w=200&h=200&fit=crop',n:'Glass Panel'},{img:'https://images.unsplash.com/photo-1661533816434-63ee0321ab8f?w=200&h=200&fit=crop',n:'Painted'},{img:'https://images.unsplash.com/photo-1646006409295-f1b05e7200f5?w=200&h=200&fit=crop',n:'Teak'}],
                      'Window':[{img:'https://images.unsplash.com/photo-1667660664335-f026a2614577?w=200&h=200&fit=crop',n:'Aluminium'},{img:'https://images.unsplash.com/photo-1683557165720-cc8dd486233c?w=200&h=200&fit=crop',n:'Wood Frame'},{img:'https://images.unsplash.com/photo-1761079976271-3a78f547ca67?w=200&h=200&fit=crop',n:'Steel Frame'},{img:'https://images.unsplash.com/photo-1772992552339-2f43cfa07b9c?w=200&h=200&fit=crop',n:'Clear Glass'},{img:'https://images.unsplash.com/photo-1596902362438-e8516a972fb5?w=200&h=200&fit=crop',n:'Tinted Glass'},{img:'https://images.unsplash.com/photo-1632324875014-b5713099bef4?w=200&h=200&fit=crop',n:'UPVC'}],
                      'Glass':[{img:'https://images.unsplash.com/photo-1772992552339-2f43cfa07b9c?w=200&h=200&fit=crop',n:'Clear'},{img:'https://images.unsplash.com/photo-1596902362438-e8516a972fb5?w=200&h=200&fit=crop',n:'Tinted'},{img:'https://images.unsplash.com/photo-1551148552-b631bbe476b2?w=200&h=200&fit=crop',n:'Frosted'},{img:'https://images.unsplash.com/photo-1763965780173-a94955ed16c7?w=200&h=200&fit=crop',n:'Textured'},{img:'https://images.unsplash.com/photo-1648583189779-536c76a17957?w=200&h=200&fit=crop',n:'Wire Mesh'},{img:'https://images.unsplash.com/photo-1771795638652-01821921a461?w=200&h=200&fit=crop',n:'Etched'}],
                      'Partition':[{img:'https://images.unsplash.com/photo-1772992552339-2f43cfa07b9c?w=200&h=200&fit=crop',n:'Glass'},{img:'https://images.unsplash.com/photo-1683557165720-cc8dd486233c?w=200&h=200&fit=crop',n:'Wood'},{img:'https://images.unsplash.com/photo-1667660664335-f026a2614577?w=200&h=200&fit=crop',n:'Metal'},{img:'https://images.unsplash.com/photo-1771098302185-2d99a6fb2379?w=200&h=200&fit=crop',n:'Fabric'},{img:'https://images.unsplash.com/photo-1565672850526-ba956f6fc6fc?w=200&h=200&fit=crop',n:'Rattan'},{img:'https://images.unsplash.com/photo-1661533816434-63ee0321ab8f?w=200&h=200&fit=crop',n:'Plaster'}],
                      'Carpet':[{img:'https://images.unsplash.com/photo-1600166898405-3aad6191b57b?w=200&h=200&fit=crop',n:'Wool'},{img:'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=200&h=200&fit=crop',n:'Jute'},{img:'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=200&h=200&fit=crop',n:'Cotton'},{img:'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=200&h=200&fit=crop',n:'Silk Blend'},{img:'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200&h=200&fit=crop',n:'Shag'},{img:'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=200&h=200&fit=crop',n:'Flatweave'}],
                      'Decor':[{img:'https://images.unsplash.com/photo-1572596116404-98f227c01ac1?w=200&h=200&fit=crop',n:'Ceramic'},{img:'https://images.unsplash.com/photo-1667660664335-f026a2614577?w=200&h=200&fit=crop',n:'Metal'},{img:'https://images.unsplash.com/photo-1772992552339-2f43cfa07b9c?w=200&h=200&fit=crop',n:'Glass'},{img:'https://images.unsplash.com/photo-1750791007759-ae174e1e63cf?w=200&h=200&fit=crop',n:'Stone'},{img:'https://images.unsplash.com/photo-1683557165720-cc8dd486233c?w=200&h=200&fit=crop',n:'Wood'},{img:'https://images.unsplash.com/photo-1565672850526-ba956f6fc6fc?w=200&h=200&fit=crop',n:'Rattan'}],'Lighting':[{img:'https://images.unsplash.com/photo-1667660664335-f026a2614577?w=200&h=200&fit=crop',n:'Brushed Metal'},{img:'https://images.unsplash.com/photo-1772992552339-2f43cfa07b9c?w=200&h=200&fit=crop',n:'Glass'},{img:'https://images.unsplash.com/photo-1572596116404-98f227c01ac1?w=200&h=200&fit=crop',n:'Ceramic Base'},{img:'https://images.unsplash.com/photo-1771098302185-2d99a6fb2379?w=200&h=200&fit=crop',n:'Fabric Shade'},{img:'https://images.unsplash.com/photo-1683557165720-cc8dd486233c?w=200&h=200&fit=crop',n:'Wood Accent'},{img:'https://images.unsplash.com/photo-1771795638652-01821921a461?w=200&h=200&fit=crop',n:'Marble Base'}],
                    } as Record<string,{img:string,n:string}[]>)[selectedCategory] || []).map((sw, i) => (
                      <div key={i} style={{ cursor: 'pointer' }} onClick={() => { setSelectedMaterial(sw.n); setSelectedMaterialImageUrl(sw.img); }}>
                        <div style={{ width: 100, height: 100, borderRadius: 8, overflow: 'hidden', border: selectedMaterial === sw.n ? '1.5px solid #ffffff' : '1.5px solid transparent', transition: 'border-color 150ms ease' }}>
                          <img src={sw.img} alt={sw.n} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 4 }}>{sw.n}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            {/* Confirm Customisation button (Edit → catalog / style / colour / material) */}
            <div
              style={{
                padding: isMobile
                  ? '10px 16px calc(12px + env(safe-area-inset-bottom, 0px))'
                  : '12px 16px 16px',
                flexShrink: 0,
                position: 'sticky',
                bottom: 0,
                zIndex: isMobile ? 62 : 4,
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 28%, rgba(0,0,0,0.78) 100%)',
                backdropFilter: isMobile ? 'blur(6px)' : undefined,
                WebkitBackdropFilter: isMobile ? 'blur(6px)' : undefined,
              }}
            >
              <button
                type="button"
                disabled={customActiveTab === 'Edit' ? editCustomizationConfirmDisabled : false}
                onClick={() => void handleConfirmCustomisation()}
                style={{
                  width: '100%',
                  height: '44px',
                  borderRadius: '8px',
                  background: '#000000',
                  border: '1.5px solid #FFFFFF',
                  cursor: customActiveTab === 'Edit' && editCustomizationConfirmDisabled ? 'not-allowed' : 'pointer',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#FFFFFF',
                  letterSpacing: '-0.1px',
                  transition: 'all 180ms ease',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.22)',
                  opacity: customActiveTab === 'Edit' && editCustomizationConfirmDisabled ? 0.5 : 1,
                }}
                onMouseEnter={e => {
                  if (customActiveTab === 'Edit' && editCustomizationConfirmDisabled) return;
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.85)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.32)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#000000';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.22)';
                }}
              >
                {apiGenerating && apiGenerateKind === 'customize' ? 'Applying…' : 'Confirm Customisation'}
              </button>
            </div>
          </div>
        ) : (<>
        {/* Tabs */}
        <div
          ref={headerRef}
          style={{
            flexShrink:    0,
            display:       'flex',
            flexDirection: 'column',
            position:      'relative',
          }}
        >
          {/* Labels row */}
          <div
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              padding:        '18px 20px 12px',
            }}
          >
            <span
              ref={colorRef}
              onClick={() => setActiveTab('color')}
              style={{
                fontFamily:     "'Inter', sans-serif",
                fontSize:       '10px',
                fontWeight:     300,
                letterSpacing:  '0.04em',
                color:          activeTab === 'color' ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.40)',
                whiteSpace:     'nowrap',
                cursor:         'pointer',
                transition:     'color 200ms ease',
                userSelect:     'none',
                lineHeight:     1,
                paddingBottom:  '0px',
              }}
            >
              COLOR
            </span>
            <span
              ref={styleRef}
              onClick={() => setActiveTab('style')}
              style={{
                fontFamily:     "'Inter', sans-serif",
                fontSize:       '10px',
                fontWeight:     300,
                letterSpacing:  '0.04em',
                color:          activeTab === 'style' ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.40)',
                whiteSpace:     'nowrap',
                cursor:         'pointer',
                transition:     'color 200ms ease',
                userSelect:     'none',
                lineHeight:     1,
                paddingBottom:  '0px',
              }}
            >
              STYLE SELECTION
            </span>
          </div>

          {/* Full-width 1px divider */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', position: 'relative' }}>
            {/* Active indicator — solid white, 2px, width matches text */}
            <div
              style={{
                position:      'absolute',
                top:           '-1.5px',
                height:        '2px',
                width:         `${indicatorStyle.width}px`,
                left:          `${indicatorStyle.left}px`,
                background:    '#FFFFFF',
                borderRadius:  '1px',
                transition:    'left 280ms cubic-bezier(0.4, 0, 0.2, 1), width 280ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>
        </div>

        {/* Swatches grid — scrollable */}
        <div
          style={{
            flex:      1,
            minHeight: 0,
            overflowY: 'auto',
            padding:   '20px 20px 12px',
            position:  'relative',
          }}
          className="gr-scroll"
        >
          <style>{`
            .gr-scroll::-webkit-scrollbar { width: 3px; }
            .gr-scroll::-webkit-scrollbar-track { background: transparent; }
            .gr-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.10); border-radius: 4px; }
          `}</style>

          <div
            style={{
              display:             'grid',
              gridTemplateColumns: '1fr 1fr',
              columnGap:           '16px',
              rowGap:              '22px',
            }}
          >
            {palettes.map(palette => {
              const isStyleTab = activeTab === 'style';
              const isSel = isStyleTab ? selectedStyle === palette.name : selectedPalette === palette.name;
              const styleImg = isStyleTab && 'img' in palette ? (palette as { img?: string }).img : null;
              return (
                <div
                  key={palette.name}
                  onClick={() => {
                    if (isStyleTab) {
                      setSelectedStyle(palette.name);
                    } else {
                      setSelectedPalette(isSel ? null : palette.name);
                      if ('dots' in palette) setSelectedColorDots(palette.dots);
                    }
                  }}
                  style={{
                    display:       'flex',
                    flexDirection: 'column',
                    alignItems:    'center',
                    cursor:        'pointer',
                    gap:           '8px',
                  }}
                >
                  {/* Swatch — circular thumbnail for Style, rounded square for Color */}
                  {isStyleTab ? (
                    <div
                      style={{
                        width:          '100px',
                        height:         '100px',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        flexShrink:     0,
                      }}
                    >
                      <div
                        style={{
                          width:        isSel ? '100px' : '88px',
                          height:       isSel ? '100px' : '88px',
                          borderRadius: '50%',
                          border:       isSel ? '2px solid #ffffff' : 'none',
                          transition:   'all 220ms cubic-bezier(0.4, 0, 0.2, 1)',
                          overflow:     'hidden',
                          flexShrink:   0,
                        }}
                      >
                        {styleImg && (
                          <img
                            src={styleImg}
                            alt={palette.name}
                            style={{
                              width:     '100%',
                              height:    '100%',
                              objectFit: 'cover',
                              display:   'block',
                            }}
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                  <div
                    style={{
                      width:        '100px',
                      height:       '100px',
                      borderRadius: '12px',
                      background:   palette.gradient,
                      border:       isSel ? '2px solid rgba(255,255,255,0.80)' : '1px solid rgba(255,255,255,0.12)',
                      boxShadow:    isSel ? '0 0 14px rgba(255,255,255,0.18)' : 'none',
                      transition:   'all 220ms cubic-bezier(0.4, 0, 0.2, 1)',
                      flexShrink:   0,
                      overflow:     'hidden',
                      position:     'relative',
                    }}
                  >
                    {styleImg && (
                      <img
                        src={styleImg}
                        alt={palette.name}
                        style={{
                          width:     '100%',
                          height:    '100%',
                          objectFit: 'cover',
                          display:   'block',
                        }}
                      />
                    )}
                  </div>
                  )}
                  {/* Name */}
                  <span
                    style={{
                      fontFamily:  "'Inter', sans-serif",
                      fontSize:    '11px',
                      fontWeight:  isSel ? 500 : 400,
                      color:       isSel ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.65)',
                      textAlign:   'center',
                      lineHeight:  1.35,
                      transition:  'color 180ms ease',
                      wordBreak:   'break-word',
                    }}
                  >
                    {palette.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Regenerate (secondary) + Finalize — arrangement: Finalize stays enabled during wizard gen; Regenerate waits on pending */}
        <div
          style={{
            padding:    '12px 16px 16px',
            flexShrink: 0,
            display:    'flex',
            flexDirection: 'column',
            gap:        '10px',
          }}
        >
          {apiError && (
            <div
              style={{
                marginBottom: 10,
                padding:      '8px 10px',
                borderRadius: 8,
                background:   'rgba(180,60,60,0.2)',
                border:       '1px solid rgba(255,120,120,0.35)',
                fontFamily:   "'Inter', sans-serif",
                fontSize:     11,
                color:        'rgba(255,200,200,0.95)',
                lineHeight:   1.4,
              }}
            >
              {apiError}
            </div>
          )}
          {apiWarning && (
            <div
              style={{
                marginBottom: 10,
                padding:      '8px 10px',
                borderRadius: 8,
                background:   'rgba(200,150,40,0.18)',
                border:       '1px solid rgba(255,200,100,0.35)',
                fontFamily:   "'Inter', sans-serif",
                fontSize:     11,
                color:        'rgba(255,235,200,0.95)',
                lineHeight:   1.45,
              }}
            >
              {apiWarning}
            </div>
          )}
          {roomSession &&
            !generatedImageUrl &&
            !apiGenerating &&
            !externalGeneratePending &&
            !apiError &&
            !apiWarning && (
            <div
              style={{
                marginBottom: 10,
                fontFamily:   "'Inter', sans-serif",
                fontSize:     10,
                lineHeight:   1.45,
                color:        'rgba(255,255,255,0.38)',
              }}
            >
              <p style={{ margin: '0 0 8px' }}>
                Both sides match until AI runs. Use{' '}
                <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.58)' }}>Finalize the Image</span> or{' '}
                <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.58)' }}>Regenerate</span> (above it) after a first result, then wait{' '}
                <span style={{ color: 'rgba(255,255,255,0.52)' }}>30–90s</span>. In DevTools → Network → Fetch/XHR, the AI call is named{' '}
                <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>generate</span> and takes a long time; fast{' '}
                <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>blob:</span> rows are only reading your uploads (not the API).
              </p>
              <p style={{ margin: 0 }}>
                Backend: Next.js from the repo root (e.g.{' '}
                <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>npm run dev:all:3000</span> in Internalconfigf) and{' '}
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>IMAGE_GENERATION_API_KEY</span> in the root{' '}
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>.env.local</span>, not inside Internalconfigf. If Next uses another port, set{' '}
                <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>VITE_NEXT_ORIGIN</span> in Internalconfigf{' '}
                <span style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>.env.local</span>.
              </p>
            </div>
          )}
          <button
            type="button"
            style={{
              width:          '100%',
              height:         '44px',
              borderRadius:   '10px',
              background:     'transparent',
              border:         '1.5px solid rgba(255,255,255,0.85)',
              cursor:         apiGenerating || externalGeneratePending || !roomSession ? 'not-allowed' : 'pointer',
              fontFamily:     "'Inter', sans-serif",
              fontSize:       '13px',
              fontWeight:     500,
              color:          '#FFFFFF',
              letterSpacing:  '-0.1px',
              transition:     'all 180ms ease',
              boxShadow:      'none',
              opacity:        apiGenerating || externalGeneratePending || !roomSession ? 0.55 : 1,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '8px',
            }}
            disabled={apiGenerating || externalGeneratePending || !roomSession}
            onClick={() => void handleRegenerateClick()}
            onMouseEnter={(e) => {
              if (apiGenerating || externalGeneratePending || !roomSession) return;
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', opacity: 0.9 }} aria-hidden>
              <IconRegenerate />
            </span>
            Regenerate
          </button>
          <button
            type="button"
            style={{
              display:      isMobile ? 'none' : 'block',
              width:        '100%',
              height:       '44px',
              borderRadius: '10px',
              background:   finalizeDisabled ? 'rgba(0,0,0,0.45)' : '#000000',
              border:       '1.5px solid #FFFFFF',
              cursor:       finalizeDisabled ? 'not-allowed' : 'pointer',
              fontFamily:   "'Inter', sans-serif",
              fontSize:     '13px',
              fontWeight:   500,
              color:        '#FFFFFF',
              letterSpacing:'-0.1px',
              transition:   'all 180ms ease',
              boxShadow:    '0 2px 12px rgba(0,0,0,0.22)',
              opacity:      finalizeDisabled ? 0.75 : 1,
            }}
            disabled={finalizeDisabled}
            onClick={() => void handleFinalizeClick()}
            onMouseEnter={e => {
              if (finalizeDisabled) return;
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.85)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow  = '0 4px 20px rgba(0,0,0,0.32)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = finalizeDisabled ? 'rgba(0,0,0,0.45)' : '#000000';
              (e.currentTarget as HTMLButtonElement).style.boxShadow  = '0 2px 12px rgba(0,0,0,0.22)';
            }}
          >
            Finalize the Image
          </button>
        </div>
        </>)}
      </div>
    </div>

    {isMobile &&
      !mobileFinalizeDismissed &&
      !isCustomisation &&
      !!generatedImageUrl?.trim() &&
      !apiGenerating &&
      !externalGeneratePending &&
      !showEditSwitchers && (
      <button
        type="button"
        style={{
          position:     'absolute',
          right:        '14px',
          bottom:       '76px',
          width:        '168px',
          height:       '42px',
          borderRadius: '10px',
          background:   finalizeDisabled ? 'rgba(0,0,0,0.45)' : '#000000',
          border:       '1.5px solid #FFFFFF',
          cursor:       finalizeDisabled ? 'not-allowed' : 'pointer',
          fontFamily:   "'Inter', sans-serif",
          fontSize:     '13px',
          fontWeight:   500,
          color:        '#FFFFFF',
          letterSpacing:'-0.1px',
          transition:   'all 180ms ease',
          boxShadow:    '0 4px 16px rgba(0,0,0,0.32)',
          opacity:      finalizeDisabled ? 0.75 : 1,
          zIndex:       35,
        }}
        disabled={finalizeDisabled}
        onClick={() => void handleFinalizeClick()}
      >
        Finalize the Image
      </button>
    )}

    {tourModalOpen && (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-tour-modal-title"
        onClick={() => setTourModalOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100000,
          background: 'rgba(0,0,0,0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 520,
            maxHeight: 'min(90vh, 720px)',
            overflow: 'auto',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <span
              id="room-tour-modal-title"
              style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}
            >
              360° room tour
            </span>
            <button
              type="button"
              onClick={() => setTourModalOpen(false)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: 'none',
                background: 'rgba(255,255,255,0.08)',
                color: '#e2e8f0',
                cursor: 'pointer',
                fontSize: 18,
                lineHeight: 1,
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div style={{ padding: 12 }}>
            <RoomImmersiveTourSection key={tourModalKey} imageUrl={afterImage} showHeading={false} />
          </div>
        </div>
      </div>
    )}

    {/* Upload Component Image Modal */}
    {showUploadModal && (
      <div
        onClick={() => { setShowUploadModal(false); }}
        style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{ width: 480, background: 'rgba(18,18,18,0.95)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 24, position: 'relative', fontFamily: "'Inter', sans-serif" }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 500, color: '#ffffff' }}>Upload Component Images</span>
            <div
              onClick={() => setShowUploadModal(false)}
              style={{ width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4, marginBottom: 20 }}>Upload up to 3 images of the object you want to add.</div>

          {/* Upload Slots */}
          <div style={{ display: 'flex', gap: 12 }}>
            {uploadedImages.map((img, idx) => (
              <label
                key={idx}
                style={{ width: 130, height: 130, borderRadius: 10, border: '1px dashed rgba(255,255,255,0.2)', background: img ? 'transparent' : 'rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden', flexShrink: 0 }}
              >
                {img ? (
                  <>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                    <div
                      onClick={e => { e.preventDefault(); e.stopPropagation(); setUploadedImages(prev => { const n = [...prev]; n[idx] = null; return n; }); }}
                      style={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 1L7 7M7 1L1 7" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    </div>
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ opacity: 0.4 }}><path d="M10 14V3" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round"/><path d="M6 6.5L10 2.5L14 6.5" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 13v2a2 2 0 002 2h10a2 2 0 002-2v-2" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>Drop or browse</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = ev => {
                        setUploadedImages(prev => { const n = [...prev]; n[idx] = ev.target?.result as string; return n; });
                      };
                      reader.readAsDataURL(file);
                    }
                    e.target.value = '';
                  }}
                />
              </label>
            ))}
          </div>

          {/* Counter */}
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 12 }}>{uploadedImages.filter(Boolean).length} / 3 uploaded</div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button
              onClick={() => { setShowUploadModal(false); }}
              style={{ background: 'transparent', border: '0.5px solid rgba(255,255,255,0.2)', color: '#ffffff', fontSize: 13, borderRadius: 8, height: 40, padding: '0 20px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
            >Cancel</button>
            <button
              onClick={() => { const imgs = uploadedImages.filter(Boolean) as string[]; setConfirmedUploadImages(imgs); setShowUploadModal(false); setAddObjectSubPanel('uploadedComponent'); }}
              disabled={!uploadedImages.some(Boolean)}
              style={{ background: '#ffffff', color: '#000000', fontSize: 13, fontWeight: 500, border: 'none', borderRadius: 8, height: 40, padding: '0 20px', cursor: uploadedImages.some(Boolean) ? 'pointer' : 'default', fontFamily: "'Inter', sans-serif", opacity: uploadedImages.some(Boolean) ? 1 : 0.4, pointerEvents: uploadedImages.some(Boolean) ? 'auto' : 'none' }}
            >Confirm</button>
          </div>
        </div>
      </div>
    )}

    {/* Upload Replacement Image Modal */}
    {repShowUploadModal && (
      <div
        onClick={() => { setRepShowUploadModal(false); }}
        style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{ width: 480, background: 'rgba(18,18,18,0.95)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: 24, position: 'relative', fontFamily: "'Inter', sans-serif" }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 500, color: '#ffffff' }}>Upload Replacement Images</span>
            <div
              onClick={() => setRepShowUploadModal(false)}
              style={{ width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4, marginBottom: 20 }}>Upload up to 3 images of the object you want to replace.</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {repUploadedImages.map((img, idx) => (
              <label
                key={idx}
                style={{ width: 130, height: 130, borderRadius: 10, border: '1px dashed rgba(255,255,255,0.2)', background: img ? 'transparent' : 'rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden', flexShrink: 0 }}
              >
                {img ? (
                  <>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                    <div
                      onClick={e => { e.preventDefault(); e.stopPropagation(); setRepUploadedImages(prev => { const n = [...prev]; n[idx] = null; return n; }); }}
                      style={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 1L7 7M7 1L1 7" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    </div>
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ opacity: 0.4 }}><path d="M10 14V3" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round"/><path d="M6 6.5L10 2.5L14 6.5" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 13v2a2 2 0 002 2h10a2 2 0 002-2v-2" stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>Drop or browse</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = ev => {
                        setRepUploadedImages(prev => { const n = [...prev]; n[idx] = ev.target?.result as string; return n; });
                      };
                      reader.readAsDataURL(file);
                    }
                    e.target.value = '';
                  }}
                />
              </label>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 12 }}>{repUploadedImages.filter(Boolean).length} / 3 uploaded</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button
              onClick={() => { setRepShowUploadModal(false); }}
              style={{ background: 'transparent', border: '0.5px solid rgba(255,255,255,0.2)', color: '#ffffff', fontSize: 13, borderRadius: 8, height: 40, padding: '0 20px', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
            >Cancel</button>
            <button
              onClick={() => { const imgs = repUploadedImages.filter(Boolean) as string[]; setRepConfirmedUploadImages(imgs); setRepShowUploadModal(false); setReplaceSubPanel('uploadedComponent'); }}
              disabled={!repUploadedImages.some(Boolean)}
              style={{ background: '#ffffff', color: '#000000', fontSize: 13, fontWeight: 500, border: 'none', borderRadius: 8, height: 40, padding: '0 20px', cursor: repUploadedImages.some(Boolean) ? 'pointer' : 'default', fontFamily: "'Inter', sans-serif", opacity: repUploadedImages.some(Boolean) ? 1 : 0.4, pointerEvents: repUploadedImages.some(Boolean) ? 'auto' : 'none' }}
            >Confirm</button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────
function ToolbarButton({
  icon,
  label,
  onClick,
  disabled,
  active,
  iconOnly,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  /** Matches room-configuration toolbar: History highlighted while panel is open. */
  active?: boolean;
  iconOnly?: boolean;
}) {
  return (
    <div
      role="button"
      aria-label={label}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={e => {
        if (disabled || !onClick) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      onClick={disabled ? undefined : onClick}
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            iconOnly ? 0 : '6px',
        padding:        iconOnly ? '0 12px' : '0 18px',
        height:         '100%',
        cursor:         disabled ? 'not-allowed' : 'pointer',
        transition:     'background 140ms ease',
        opacity:        disabled ? 0.45 : 1,
        pointerEvents:  disabled ? 'none' : 'auto',
        background:     active ? 'rgba(255,255,255,0.08)' : 'transparent',
        outline:        'none',
      }}
      onMouseEnter={e => {
        if (disabled) return;
        if (!active) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.background = active ? 'rgba(255,255,255,0.08)' : 'transparent';
      }}
    >
      {icon}
      {!iconOnly && (
        <span
          style={{
            fontFamily:  "'Inter', sans-serif",
            fontSize:    '12px',
            fontWeight:  500,
            color:       'rgba(255,255,255,0.85)',
            whiteSpace:  'nowrap',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

function ToolbarDivider() {
  return (
    <div
      style={{
        width:      '1px',
        height:     '24px',
        background: 'rgba(255,255,255,0.15)',
        flexShrink: 0,
      }}
    />
  );
}

// ── Customisation Tab Icons ────────────────────────────────────────────────
function CustomTabIconEdit() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M14.167 2.5a2.357 2.357 0 0 1 3.333 3.333L6.25 17.083l-4.583 1.25 1.25-4.583L14.167 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CustomTabIconAdd() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M10 4.167v11.666M4.167 10h11.666" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CustomTabIconReplace() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M14.167 1.667l3.333 3.333-3.333 3.333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 9.167V7.5a5 5 0 0 1 5-5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.833 18.333L2.5 15l3.333-3.333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17.5 10.833V12.5a5 5 0 0 1-5 5h-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CustomTabIconErase() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M15.833 5.833l-2.5 11.667H6.667L4.167 5.833" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 5.833h15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 5.833V3.333a.833.833 0 0 1 .833-.833h3.334a.833.833 0 0 1 .833.833v2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CustomTabIconUndo() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M7.5 6.667L4.167 10l3.333 3.333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.167 10h6.25A4.583 4.583 0 1 1 10.417 19.167" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CustomTabIconRedo() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M12.5 6.667L15.833 10 12.5 13.333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.833 10h-6.25A4.583 4.583 0 1 0 9.583 19.167" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CustomTabIconRestart() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M10 3.333A6.667 6.667 0 1 1 4.098 6.91" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.333 3.333v4.167H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Exported Floating Tab Bar (rendered outside image panel) ────────────────
export function CustomisationTabBar({
  activeTab: controlledTab,
  onTabChange,
}: {
  activeTab?: string | null;
  onTabChange?: (tab: string | null) => void;
} = {}) {
  const [isMobileBar, setIsMobileBar] = useState(false);
  const [internalTab, setInternalTab] = useState<string | null>(null);
  const activeCustomTab = controlledTab !== undefined ? controlledTab : internalTab;
  const handleTabChange = (tab: string) => {
    // Double-click on active tab deselects
    const newTab = activeCustomTab === tab ? null : tab;
    setInternalTab(newTab);
    onTabChange?.(newTab);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setIsMobileBar(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const barStyle: React.CSSProperties = isMobileBar
    ? {
        width: '100%',
        maxWidth: '100%',
        minHeight: '40px',
        background: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '999px',
        border: '1px solid rgba(255,255,255,0.14)',
        boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        padding: '4px',
        gap: '3px',
      }
    : {
        width: '245.19px',
        height: '72px',
        background: 'rgba(0, 0, 0, 0.35)',
        borderRadius: '14px',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '0.5px solid rgba(255,255,255,0.12)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0.5px 0 rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        overflow: 'visible',
      };

  return (
    <div
      style={barStyle}
    >
      {([
        { id: 'Edit', icon: <CustomTabIconEdit /> },
        { id: 'Add Object', icon: <CustomTabIconAdd /> },
        { id: 'Replace', icon: <CustomTabIconReplace /> },
        { id: 'Erase', icon: <CustomTabIconErase /> },
      ] as const).map(tab => {
        const isActive = activeCustomTab === tab.id;
        return (
          <div
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            style={{
              display: 'flex',
              flexDirection: isMobileBar ? 'row' : 'column',
              alignItems: 'center',
              cursor: 'pointer',
              position: 'relative',
              justifyContent: isMobileBar ? 'center' : undefined,
              flex: isMobileBar ? 1 : 'unset',
              minWidth: isMobileBar ? 0 : 'unset',
              borderRadius: isMobileBar ? '999px' : undefined,
              border: isMobileBar ? `1px solid ${isActive ? 'rgba(255,255,255,0.42)' : 'transparent'}` : undefined,
              background: isMobileBar ? (isActive ? 'rgba(255,255,255,0.14)' : 'transparent') : undefined,
              height: isMobileBar ? '32px' : undefined,
              padding: isMobileBar ? '0 10px' : undefined,
              paddingTop: isMobileBar ? undefined : '15px',
              gap: isMobileBar ? '6px' : undefined,
              transition: isMobileBar ? 'background 160ms ease, border-color 160ms ease' : undefined,
            }}
          >
            {!isMobileBar && isActive && (
              <div
                style={{
                  position: 'absolute',
                  top: '-4px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '20px',
                  height: '3px',
                  borderRadius: '2px',
                  background: '#ffffff',
                }}
              />
            )}
            <div style={{ width: isMobileBar ? '14px' : '16px', height: isMobileBar ? '14px' : '16px', color: isActive ? '#ffffff' : (isMobileBar ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.45)'), display: 'flex', alignItems: 'center', justifyContent: 'center', filter: !isMobileBar && isActive ? 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.25))' : 'none' }}>
              {tab.icon}
            </div>
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: isMobileBar ? '11px' : '10px',
                fontWeight: isActive ? 500 : 400,
                color: isActive ? '#ffffff' : (isMobileBar ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.45)'),
                marginTop: isMobileBar ? undefined : '4px',
                whiteSpace: 'nowrap',
                transition: 'color 180ms ease',
                textShadow: !isMobileBar && isActive ? '0 0 4px rgba(255, 255, 255, 0.3)' : 'none',
              }}
            >
              {tab.id}
            </span>
          </div>
        );
      })}
    </div>
  );
}