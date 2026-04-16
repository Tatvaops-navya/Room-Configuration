import { useState, useRef, useEffect, useMemo } from 'react';
import { LayoutDashboard, Building2, DoorOpen, SquarePen, X, ImagePlus, ArrowRight, Upload } from 'lucide-react';
import {
  blobUrlToDataUrl,
  type RoomWizardCompletePayload,
  type RoomWizardSession,
} from '../../lib/roomGenerateApi';
import { buildApiUrl } from '../../lib/apiUrl';
import imgContainer from "figma:asset/cbb61108720d04d2ff8d142ee51098e6c2f1f1ef.png";
import imgImageRobot from "figma:asset/6854101e0adfcbe57d7b01a404b895b405fd650c.png";
import {
  DEFAULT_REGIONAL_STYLE_NAME,
  REGIONAL_STYLES,
  REGIONAL_STYLE_TABS,
  type RegionalStyleCategoryId,
} from './regionalDesignStyles';

const STEPS = [
  { label: 'Configure',   done: true },
  { label: 'Upload',      done: true },
  { label: 'Lock layout', done: true },
  { label: 'Design',      done: false },
] as const;

const CARDS = [
  {
    title: 'Internal Configuration',
    Icon:  LayoutDashboard,
    desc:  'Configure room layouts, partitions, and internal spatial arrangements.',
  },
  {
    title: 'External Configuration',
    Icon:  Building2,
    desc:  'Set exterior facades, building elevations, and outer structures.',
  },
] as const;

const PALETTES = [
  { name: 'Surprise Me',           desc: 'Let AI pick the perfect mix',         colors: ['#E8D5B7','#C9A96E','#6B4C2A'] },
  { name: 'High-Contrast Neutrals',desc: 'Bold blacks, whites and grays',        colors: ['#F5F5F5','#9CA3AF','#1A1A1A'] },
  { name: 'Forest-Inspired',       desc: 'Deep greens and earthy browns',        colors: ['#2D5A27','#7FA060','#C4A35A'] },
  { name: 'Romance',               desc: 'Soft pinks, blush and rose',           colors: ['#F9C0C0','#E07B8A','#8B2252'] },
  { name: 'Ocean Breeze',          desc: 'Crisp blues and soft seafoam',         colors: ['#B8E0F7','#4A9FC8','#1A4F72'] },
  { name: 'Sunset Warmth',         desc: 'Warm oranges, reds and golden hues',   colors: ['#F7C59F','#E8703A','#B03A2E'] },
  { name: 'Earth Tones',           desc: 'Terracotta, sand and warm browns',     colors: ['#E2C9A4','#C1784B','#7B4B2A'] },
  { name: 'Monochrome',            desc: 'Timeless shades of grey',              colors: ['#E8E8E8','#888888','#2A2A2A'] },
  { name: 'Jewel Tones',           desc: 'Rich emerald, sapphire and amethyst',  colors: ['#1A7A4A','#1B4FA6','#6B2FA0'] },
  { name: 'Pastel Dreams',         desc: 'Soft lavender, mint and blush',        colors: ['#F4C2DC','#B8E8D0','#C8C0E8'] },
  { name: 'Industrial',            desc: 'Raw steel, charcoal and rust',         colors: ['#8B8680','#4A4640','#A0522D'] },
  { name: 'Coastal Serenity',      desc: 'Sandy beige, sky blue and white',      colors: ['#F5ECD7','#7EC8C8','#FFFFFF'] },
  { name: 'Autumn Harvest',        desc: 'Burnt orange, gold and red-brown',     colors: ['#E8A040','#C45C20','#8B2500'] },
  { name: 'Lavender Mist',         desc: 'Soft purple, lilac and cool white',    colors: ['#E8D8F0','#A87DC8','#F8F4FF'] },
];

// Helper function to generate gradient for each palette
function getPaletteGradient(paletteName: string, colors: string[]): string {
  // Define specific gradient directions and color stops for each palette
  switch (paletteName) {
    case 'Ocean Breeze':
      return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`;
    case 'Forest-Inspired':
      return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[2]} 100%)`;
    case 'High-Contrast Neutrals':
      return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[2]} 100%)`;
    case 'Surprise Me':
      return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`;
    case 'Romance':
      return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`;
    case 'Sunset Warmth':
      return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[2]} 100%)`;
    case 'Earth Tones':
      return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[2]} 100%)`;
    case 'Monochrome':
      return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[2]} 100%)`;
    case 'Jewel Tones':
      return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`;
    case 'Pastel Dreams':
      return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`;
    case 'Industrial':
      return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[2]} 100%)`;
    case 'Coastal Serenity':
      return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`;
    case 'Autumn Harvest':
      return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[2]} 100%)`;
    case 'Lavender Mist':
      return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`;
    default:
      // Default: blend all colors
      return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[colors.length - 1]} 100%)`;
  }
}

export function RoomConfigStudio({
  onModalChange,
  onStepNavigate,
  onBackNavigate,
  returnToPreferences,
  onComplete,
  initialSession,
}: {
  onModalChange?: (active: boolean) => void
  onStepNavigate?: (handler: (() => void) | null) => void
  onBackNavigate?: (handler: (() => void) | null) => void
  returnToPreferences?: boolean
  onComplete?: (payload: RoomWizardCompletePayload) => void | Promise<void>
  initialSession?: RoomWizardSession | null
}) {
  const [hoveredCard,     setHoveredCard]     = useState<string | null>(null);
  const [activeModal,     setActiveModal]     = useState<'internal' | 'external' | null>(null);
  const [internalImages,  setInternalImages]  = useState<(string | null)[]>(Array(6).fill(null));
  const [externalImages,  setExternalImages]  = useState<(string | null)[]>(Array(6).fill(null));
  const fileRefs          = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));
  const rafRef            = useRef<number | null>(null);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analysisDone,    setAnalysisDone]    = useState(false);

  const [selectedImage,   setSelectedImage]   = useState<number | null>(null);
  const [modalStep,       setModalStep]       = useState<'upload' | 'configMode' | 'styleSelect' | 'paletteSelect' | 'preferences'>('configMode');
  const [selectedConfigMode, setSelectedConfigMode] = useState<'purpose' | 'arrangement'>('purpose');
  const [styleCategoryTab, setStyleCategoryTab] = useState<RegionalStyleCategoryId>('indian');
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [selectedPalette, setSelectedPalette] = useState<string | null>(null);
  const [hoveredPalette,  setHoveredPalette]  = useState<string | null>(null);
  const [wizardSubmitting, setWizardSubmitting] = useState(false);
  const [wizardSubmitError, setWizardSubmitError] = useState<string | null>(null);

  const [imageTypeValidation, setImageTypeValidation] = useState<{ valid: boolean; message: string } | null>(null);
  const [isValidatingImageType, setIsValidatingImageType] = useState(false);
  const [internalRoomContext, setInternalRoomContext] = useState('');
  const [externalRoomContext, setExternalRoomContext] = useState('');
  const [preferenceAdditionalNotes, setPreferenceAdditionalNotes] = useState('');
  const [preferenceReferenceImages, setPreferenceReferenceImages] = useState<string[]>([]);
  const preferenceRefInputRef = useRef<HTMLInputElement | null>(null);

  const uploadedImages    = activeModal === 'internal' ? internalImages : externalImages;
  const setUploadedImages = activeModal === 'internal' ? setInternalImages : setExternalImages;

  const selectedRegionalStyle = useMemo(
    () => REGIONAL_STYLES.find((s) => s.id === selectedStyleId),
    [selectedStyleId],
  );
  const stylesInCategory = useMemo(
    () => REGIONAL_STYLES.filter((s) => s.category === styleCategoryTab),
    [styleCategoryTab],
  );

  const minImages = 1;
  const maxImages = 6;
  const uploadImageFingerprint = uploadedImages.map((u) => u ?? '').join('\0');

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedImages(prev => {
      const next = [...prev];
      next[index] = url;
      return next;
    });
  };

  const handleCloseModal = () => {
    setUploadedImages(Array(6).fill(null));
    setActiveModal(null);
    setAnalyzeProgress(0);
    setAnalysisDone(false);
    setSelectedImage(null);
    setModalStep('configMode');
    setSelectedConfigMode('purpose');
    setSelectedStyleId(null);
    setStyleCategoryTab('indian');
    setSelectedPalette(null);
    setImageTypeValidation(null);
    setIsValidatingImageType(false);
    setInternalRoomContext('');
    setExternalRoomContext('');
    setPreferenceAdditionalNotes('');
    setPreferenceReferenceImages([]);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  const handlePreferenceReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = Math.max(0, 6 - preferenceReferenceImages.length);
    if (remaining <= 0) return;
    const nextUrls = files.slice(0, remaining).map((f) => URL.createObjectURL(f));
    setPreferenceReferenceImages((prev) => [...prev, ...nextUrls]);
    // allow selecting same file again
    e.target.value = '';
  };

  const removePreferenceReferenceImage = (index: number) => {
    setPreferenceReferenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  const filledCount = uploadedImages.filter(Boolean).length;
  const hasMinUploads = filledCount >= minImages;
  /** Progress UI only while waiting on API or before we know the result (hide on failed type check). */
  const showValidationProgress =
    hasMinUploads &&
    !analysisDone &&
    imageTypeValidation?.valid !== false &&
    (isValidatingImageType || imageTypeValidation === null);
  const canProceedFromUpload =
    hasMinUploads &&
    analysisDone &&
    selectedImage !== null &&
    imageTypeValidation?.valid === true;

  /** Visual progress while validation runs (capped until API returns). */
  useEffect(() => {
    if (!activeModal || !hasMinUploads || analysisDone) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (!hasMinUploads || !activeModal) setAnalyzeProgress(0);
      return;
    }
    if (!isValidatingImageType) return;

    setAnalyzeProgress(0);
    const startTime = performance.now();
    const duration = 4000;
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnalyzeProgress(Math.min(92, Math.round(eased * 100)));
      if (t < 1 && isValidatingImageType) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [activeModal, hasMinUploads, isValidatingImageType, analysisDone]);

  useEffect(() => {
    if (!activeModal || filledCount < minImages) {
      setIsValidatingImageType(false);
      setImageTypeValidation(null);
      setAnalysisDone(false);
      setAnalyzeProgress(0);
      setSelectedImage(null);
      return;
    }

    let cancelled = false;
    setIsValidatingImageType(true);
    setImageTypeValidation(null);
    setAnalysisDone(false);
    setSelectedImage(null);
    setAnalyzeProgress(0);

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const urls = uploadedImages.filter((u): u is string => u != null && u !== '');
          const toValidate = urls.slice(0, 6);
          const dataUrls = await Promise.all(toValidate.map((u) => blobUrlToDataUrl(u)));
          const res = await fetch(buildApiUrl('/api/validate-image-type'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              images: dataUrls,
              expectedType: activeModal === 'external' ? 'external' : 'internal',
            }),
          });
          const text = await res.text();
          let data: { valid?: boolean; message?: string } = {};
          try {
            data = JSON.parse(text) as { valid?: boolean; message?: string };
          } catch {
            if (!res.ok) {
              if (!cancelled) {
                setImageTypeValidation({
                  valid: false,
                  message: text || 'Could not validate images.',
                });
              }
              return;
            }
          }
          const valid = res.ok && data.valid === true;
          const message =
            typeof data.message === 'string' ? data.message : valid ? 'Images match.' : 'Image type does not match configuration.';
          if (cancelled) return;
          setImageTypeValidation({ valid, message });
          if (valid) {
            setAnalyzeProgress(100);
            setTimeout(() => {
              if (!cancelled) setAnalysisDone(true);
            }, 350);
          } else {
            setAnalyzeProgress(0);
          }
        } catch {
          if (!cancelled) {
            setImageTypeValidation({
              valid: false,
              message:
                "We couldn't verify your images. Check that Next.js is running on port 3000 and try again.",
            });
            setAnalyzeProgress(0);
          }
        } finally {
          if (!cancelled) setIsValidatingImageType(false);
        }
      })();
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeModal, filledCount, minImages, uploadImageFingerprint]);

  /** With a single uploaded photo, skip forcing an extra tap to pick the layout anchor. */
  useEffect(() => {
    if (!analysisDone || imageTypeValidation?.valid !== true) return;
    const filledIndices = uploadedImages.map((u, i) => (u ? i : -1)).filter((i) => i >= 0);
    if (filledIndices.length !== 1) return;
    if (selectedImage !== null && uploadedImages[selectedImage]) return;
    setSelectedImage(filledIndices[0]!);
  }, [analysisDone, imageTypeValidation, uploadImageFingerprint, uploadedImages, selectedImage]);

  /* Notify parent whenever modal opens / closes */
  useEffect(() => {
    onModalChange?.(!!activeModal);
  }, [activeModal, onModalChange]);

  /* Handle returning to preferences from results screen */
  useEffect(() => {
    if (returnToPreferences && !activeModal) {
      const session = initialSession ?? null;
      // Reopen the correct wizard and restore prior selections so Generate & Configure
      // can run with the same room images even after coming back from results.
      const modal = session?.configType === 'external' ? 'external' : 'internal';
      setActiveModal(modal);
      if (session) {
        const restored = Array(6).fill(null) as (string | null)[];
        session.imagesDataUrl.slice(0, 6).forEach((src, i) => {
          restored[i] = src;
        });
        if (modal === 'external') {
          setExternalImages(restored);
        } else {
          setInternalImages(restored);
        }
        const safeLayout = Number.isFinite(session.layoutIndex)
          ? Math.max(0, Math.min(session.layoutIndex, Math.max(0, session.imagesDataUrl.length - 1)))
          : 0;
        setSelectedImage(safeLayout);
        setSelectedConfigMode(session.configMode === 'arrangement' ? 'arrangement' : 'purpose');
        setSelectedStyleId(session.style?.trim() ? session.style.trim() : DEFAULT_REGIONAL_STYLE_NAME);
        setSelectedPalette(session.paletteName ?? null);
        if (modal === 'external') {
          setExternalRoomContext(session.roomContext ?? '');
          setInternalRoomContext('');
        } else {
          setInternalRoomContext(session.roomContext ?? '');
          setExternalRoomContext('');
        }
        setPreferenceAdditionalNotes(session.additionalNotes ?? '');
        setPreferenceReferenceImages(session.optionalReferenceImages ?? []);
      }
      setModalStep('preferences');
    }
  }, [returnToPreferences, activeModal, initialSession]);

  /* Expose step navigation handler to parent */
  useEffect(() => {
    if (!activeModal) {
      onStepNavigate?.(() => null);
      onBackNavigate?.(() => null);
      return;
    }

    const nextStepHandler = () => {
      if (modalStep === 'configMode') {
        setModalStep('upload');
      } else if (modalStep === 'upload') {
        if (selectedConfigMode === 'arrangement') {
          setSelectedStyleId(null);
          setSelectedPalette(null);
          setModalStep('preferences');
        } else {
          setModalStep('styleSelect');
        }
      } else if (modalStep === 'styleSelect') {
        setModalStep('paletteSelect');
      } else if (modalStep === 'paletteSelect') {
        setModalStep('preferences');
      }
      // No next step after 'preferences'
    };

    const backStepHandler = () => {
      if (modalStep === 'configMode') {
        handleCloseModal();
      } else if (modalStep === 'upload') {
        setModalStep('configMode');
      } else if (modalStep === 'styleSelect') {
        setModalStep('upload');
      } else if (modalStep === 'paletteSelect') {
        setModalStep('styleSelect');
      } else if (modalStep === 'preferences') {
        if (selectedConfigMode === 'arrangement') {
          setModalStep('upload');
        } else {
          setModalStep('paletteSelect');
        }
      }
    };

    onStepNavigate?.(() => nextStepHandler);
    onBackNavigate?.(() => backStepHandler);
  }, [activeModal, modalStep, selectedConfigMode, onStepNavigate, onBackNavigate]);

  /** Figma-style glass panel: #121214 @ 82% + inner highlight rings */
  const glassCardStyle = {
    borderRadius:         '24px' as const,
    background:           'rgba(18, 18, 20, 0.82)',
    backdropFilter:       'blur(40px)',
    WebkitBackdropFilter: 'blur(40px)',
    border:               '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow:            'inset 0 0 0 1px rgba(255, 255, 255, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.07), 0 24px 64px rgba(0, 0, 0, 0.45)',
  };

  return (
    <div
      style={{
        position:      'relative',
        width:         '100%',
        height:        '100%',
        background:    'transparent',
        display:       'flex',
        flexDirection: 'column',
        overflow:      'hidden',
        fontFamily:    "'Inter', sans-serif",
        paddingTop:    '48px',
      }}
    >
      {/* Full-bleed hero background (same asset as Figma / results view) */}
      <div
        aria-hidden
        style={{
          position:       'absolute',
          inset:          0,
          zIndex:         0,
          pointerEvents:  'none',
        }}
      >
        <img
          src={imgContainer}
          alt=""
          style={{
            position:       'absolute',
            inset:          0,
            width:          '100%',
            height:         '100%',
            objectFit:      'cover',
            objectPosition: 'center center',
          }}
        />
        <div
          style={{
            position:   'absolute',
            inset:      0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.38) 45%, rgba(0,0,0,0.52) 100%)',
          }}
        />
      </div>

      <style>{`
        @keyframes rcs-bot-breathe {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.028); }
        }
        /* Black matte in asset → blends into hero; no pink halo */
        .rcs-bot {
          mix-blend-mode: screen;
          animation: rcs-bot-breathe 1900ms ease-in-out infinite;
          filter: drop-shadow(0 2px 16px rgba(0,0,0,0.35));
        }

        @keyframes rcs-glow-pulse {
          0%, 100% { opacity: 0.85; }
          50%       { opacity: 1;    }
        }
        .rcs-active-glow { animation: rcs-glow-pulse 2200ms ease-in-out infinite; }

        @keyframes rcs-analyze-glow {
          0%, 100% { box-shadow: 0 0 10px rgba(255,255,255,0.55), 0 0 22px rgba(255,255,255,0.22); }
          50%       { box-shadow: 0 0 16px rgba(255,255,255,0.80), 0 0 34px rgba(255,255,255,0.36); }
        }
        .rcs-analyze-fill { animation: rcs-analyze-glow 1600ms ease-in-out infinite; }

        .rcs-style-grid::-webkit-scrollbar { width: 4px; }
        .rcs-style-grid::-webkit-scrollbar-track { background: transparent; }
        .rcs-style-grid::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
      `}</style>

      {/* ── Blur overlay lives in UploadFloorPlan root stacking context ── */}

      {/* Main body — NO zIndex so it doesn't form a stacking context.        */}
      {/* Hero text & cards stay in category-6 (below blur at z=50).          */}
      {/* Stepper's z=100 propagates directly to motion.div SC (above blur).  */}
      <div
        style={{
          position:  'relative',
          zIndex:    1,
          flex:      1,
          display:   'flex',
          padding:   '24px 32px 24px 136px',
          minHeight: 0,
          overflow:  'hidden',
        }}
      >
        {/* Central area */}
        <div
          style={{
            position:       'relative',
            flex:           1,
            minHeight:      0,
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'flex-start',
            gap:            '40px',
            paddingTop:     '28px',
            paddingLeft:    '20px',
            paddingRight:   '20px',
            overflowY:      'auto',
          }}
        >
          {/* Blur overlay — REMOVED from here, now lives at root level above */}

          {/* Progress tracker */}
          <div style={{ position: 'relative', zIndex: 100, width: '100%', maxWidth: '720px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              {STEPS.map((step, i) => {
                const prevDone = i > 0 && STEPS[i - 1].done && step.done;
                const nextDone = i < STEPS.length - 1 && step.done && STEPS[i + 1].done;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      {/* Left connector */}
                      <div style={{
                        flex:         1,
                        height:       '2px',
                        borderRadius: '2px',
                        background:   i === 0 ? 'transparent'
                          : prevDone
                            ? 'linear-gradient(90deg, rgba(47,122,85,0.55), rgba(141,227,181,0.85))'
                            : 'rgba(255,255,255,0.08)',
                        filter: (i !== 0 && prevDone)
                          ? 'drop-shadow(0 0 4px rgba(74,222,128,0.55))'
                          : 'none',
                      }} />

                      {/* Step circle */}
                      <div style={{
                        width:                '38px',
                        height:               '38px',
                        borderRadius:         '50%',
                        flexShrink:           0,
                        position:             'relative',
                        display:              'flex',
                        alignItems:           'center',
                        justifyContent:       'center',
                        background:           step.done
                          ? 'radial-gradient(circle at 38% 36%, rgba(74,222,128,0.92) 0%, rgba(34,197,94,0.68) 48%, rgba(22,163,74,0.88) 100%)'
                          : 'rgba(255,255,255,0.044)',
                        border:               step.done
                          ? '1px solid rgba(134,239,172,0.40)'
                          : '1.5px solid rgba(255,255,255,0.12)',
                        boxShadow:            step.done
                          ? '0 0 14px rgba(34,197,94,0.55), 0 0 30px rgba(34,197,94,0.22), inset 0 -4px 9px rgba(0,0,0,0.30), inset 0 1px 2px rgba(255,255,255,0.28)'
                          : 'none',
                        backdropFilter:       step.done ? 'blur(20px)' : 'blur(10px)',
                        WebkitBackdropFilter: step.done ? 'blur(20px)' : 'blur(10px)',
                        overflow:             'hidden',
                      }}>
                        {step.done && (
                          <>
                            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.18) 36%, transparent 58%)', pointerEvents: 'none' }} />
                            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'linear-gradient(142deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.07) 36%, transparent 58%)', pointerEvents: 'none' }} />
                            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'linear-gradient(to top, rgba(0,0,0,0.26) 0%, transparent 46%)', pointerEvents: 'none' }} />
                            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: ['radial-gradient(circle at 68% 22%, rgba(255,255,255,0.50) 0%, transparent 16%)', 'radial-gradient(circle at 78% 34%, rgba(255,255,255,0.18) 0%, transparent 10%)'].join(', '), pointerEvents: 'none' }} />
                          </>
                        )}
                        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {step.done ? (
                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                              <path d="M2.5 7.5L6 11L12.5 4.5" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <span style={{ color: 'rgba(255,255,255,0.24)', fontSize: '11px', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                              {i + 1}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right connector */}
                      <div style={{
                        flex:         1,
                        height:       '2px',
                        borderRadius: '2px',
                        background:   i === STEPS.length - 1 ? 'transparent'
                          : nextDone
                            ? 'linear-gradient(90deg, rgba(141,227,181,0.85), rgba(47,122,85,0.55))'
                            : 'rgba(255,255,255,0.08)',
                        filter: (i !== STEPS.length - 1 && nextDone)
                          ? 'drop-shadow(0 0 4px rgba(74,222,128,0.55))'
                          : 'none',
                      }} />
                    </div>

                    <span style={{
                      marginTop:     '10px',
                      color:         step.done ? 'rgba(255,255,255,0.74)' : 'rgba(255,255,255,0.22)',
                      fontSize:      '11px',
                      fontWeight:    step.done ? 500 : 400,
                      letterSpacing: '0.20px',
                      textAlign:     'center',
                      whiteSpace:    'nowrap',
                      fontFamily:    "'Inter', sans-serif",
                    }}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hero text */}
          <div style={{ width: '100%', maxWidth: '820px', textAlign: 'center' }}>
            <h1 style={{ margin: 0, marginBottom: '13px', fontFamily: "'Inter', sans-serif", fontSize: '31px', fontWeight: 600, color: '#f4f0e6', letterSpacing: '0px', lineHeight: 1.18 }}>
              AI Room Configuration Studio
            </h1>
            <p style={{ margin: '0 auto', fontFamily: "'Inter', sans-serif", fontSize: '13.5px', fontWeight: 400, color: 'rgba(255,255,255,0.44)', letterSpacing: '-0.10px', lineHeight: '1.66', maxWidth: '520px' }}>
              Choose full-room or custom-component mode, upload your images, lock the layout reference, then continue with style, palette, and preferences.
            </p>
          </div>

          {/* Configuration cards */}
          <div style={{ display: 'flex', gap: '24px', alignItems: 'stretch' }}>
            {CARDS.map(({ title, Icon, desc }) => {
              const isHovered  = hoveredCard === title;
              const isInternal = title === 'Internal Configuration';
              return (
                <div
                  key={title}
                  onMouseEnter={() => setHoveredCard(title)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    width:                '300px',
                    padding:              '38px 28px 36px',
                    transform:            isHovered ? 'translateY(-5px)' : 'translateY(0)',
                    display:              'flex',
                    flexDirection:        'column',
                    alignItems:           'center',
                    gap:                  '14px',
                    cursor:               'pointer',
                    transition:           'all 200ms ease',
                    ...glassCardStyle,
                    border:               isHovered ? '1px solid rgba(255,255,255,0.22)' : glassCardStyle.border,
                    boxShadow:            isHovered
                      ? 'inset 0 0 0 1px rgba(255,255,255,0.14), inset 0 1px 0 rgba(255,255,255,0.10), 0 28px 72px rgba(0,0,0,0.5), 0 0 40px rgba(255,255,255,0.06)'
                      : glassCardStyle.boxShadow,
                  }}
                >
                  <div style={{
                    width:          '58px',
                    height:         '58px',
                    borderRadius:   '16px',
                    background:     isHovered ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.055)',
                    border:         isHovered ? '1px solid rgba(255,255,255,0.24)' : '1px solid rgba(255,255,255,0.09)',
                    boxShadow:      isHovered ? '0 0 20px rgba(255,255,255,0.12)' : 'none',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    flexShrink:     0,
                    transition:     'all 200ms ease',
                  }}>
                    <Icon size={26} style={{ color: isHovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.80)', filter: isHovered ? 'drop-shadow(0 0 8px rgba(255,255,255,0.45))' : 'none', transition: 'all 200ms ease' }} />
                  </div>

                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '18px', fontWeight: 600, color: 'rgba(255,255,255,0.92)', textAlign: 'center', lineHeight: 1.22 }}>
                    {title}
                  </span>

                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 400, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: '1.62', maxWidth: '218px' }}>
                    {desc}
                  </span>

                  <div
                    onClick={isInternal ? () => setActiveModal('internal') : () => setActiveModal('external')}
                    style={{
                      marginTop:      '8px',
                      background:     isHovered ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.07)',
                      borderRadius:   '10px',
                      height:         '43px',
                      width:          '140px',
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                      cursor:         'pointer',
                      border:         isHovered ? '1.5px solid rgba(255,255,255,0.80)' : '1px solid rgba(255,255,255,0.11)',
                      boxShadow:      isHovered ? '0px 0px 18px rgba(255,255,255,0.22), inset 0px 1px 2px rgba(255,255,255,0.08)' : 'none',
                      transition:     'all 200ms ease',
                      flexShrink:     0,
                    }}
                  >
                    <span style={{ fontFamily: "'Inter', sans-serif", color: isHovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.80)', fontSize: '13px', fontWeight: 500, letterSpacing: '0.10px', transition: 'color 200ms ease' }}>
                      Get Started
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Floating bot — zIndex:60 keeps it above blur (50) when modal is open */}
      <div style={{ position: 'absolute', bottom: '24px', right: '30px', zIndex: 60, cursor: 'pointer' }}>
        <img
          src={imgImageRobot}
          alt="AI Assistant"
          className="rcs-bot"
          style={{ width: '78px', height: '78px', objectFit: 'contain', display: 'block' }}
        />
      </div>

      {/* ── MODAL ──────────────────────────────────────────────────── */}
      {activeModal && (
        <div
          onClick={handleCloseModal}
          style={{
            position:       'fixed',
            top:            '48px',
            left:           '112px',
            right:          0,
            bottom:         0,
            zIndex:         200,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            paddingTop:     '80px',
            paddingBottom:  '24px',
            overflowY:      'auto',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width:                '620px',
              minHeight:            '441px',
              maxHeight:            'min(90vh, 780px)',
              borderRadius:         '24px',
              background:           'rgba(18,18,20,0.82)',
              backdropFilter:       'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              border:               '1px solid rgba(255,255,255,0.08)',
              boxShadow:            '0 32px 80px rgba(0,0,0,0.60), inset 0 0 0 1px rgba(255,255,255,0.10), inset 0 1px 0 rgba(255,255,255,0.07)',
              display:              'flex',
              flexDirection:        'column',
              overflowX:            'hidden',
              overflowY:            'auto',
            }}
          >

            {/* ══ STEP 2 — UPLOAD & LOCK LAYOUT ═══════════════════ */}
            {modalStep === 'upload' && (
              <>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 32px 0' }}>
                  <div>
                    <h2 style={{ margin: 0, marginBottom: '7px', fontFamily: "'Inter', sans-serif", fontSize: '20px', fontWeight: 600, color: '#f4f0e6', lineHeight: 1.2 }}>
                      {activeModal === 'external' ? 'Upload exterior images' : 'Upload room images'}
                    </h2>
                    <p style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.42)', lineHeight: 1.55 }}>
                      {activeModal === 'external'
                        ? 'Upload one or more clear photos for AI detection: elevations, compound, or open area. Extra angles are optional.'
                        : 'Upload at least one clear photo of the room (interior only). Add more slots for different angles if you like—optional but helpful.'}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background 180ms ease' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.11)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  >
                    <X size={14} style={{ color: 'rgba(255,255,255,0.55)' }} />
                  </button>
                </div>

                {/* Upload grid 3×2 */}
                <div style={{
                  flex:                '1',
                  minHeight:           0,
                  padding:             '14px 32px',
                  display:             'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gridTemplateRows:    'repeat(2, 1fr)',
                  columnGap:           '16px',
                  rowGap:              '16px',
                }}>
                  {Array.from({ length: 6 }, (_, i) => {
                    const imgUrl       = uploadedImages[i];
                    const isSelected   = selectedImage === i;
                    const inSelectMode = analysisDone;
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          if (inSelectMode && imgUrl) {
                            setSelectedImage(i);
                          } else if (!inSelectMode) {
                            fileRefs.current[i]?.click();
                          }
                        }}
                        style={{
                          borderRadius:         '12px',
                          border:               inSelectMode && imgUrl
                            ? isSelected ? '2px solid rgba(255,255,255,0.90)' : '1px solid rgba(255,255,255,0.28)'
                            : imgUrl ? '1px solid rgba(255,255,255,0.45)' : '1.5px dashed rgba(255,255,255,0.14)',
                          background:           imgUrl ? 'transparent' : 'rgba(255,255,255,0.030)',
                          backdropFilter:       'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                          display:              'flex',
                          flexDirection:        'column',
                          alignItems:           'center',
                          justifyContent:       'center',
                          gap:                  '9px',
                          cursor:               inSelectMode ? (imgUrl ? 'pointer' : 'default') : 'pointer',
                          overflow:             'hidden',
                          position:             'relative',
                          boxShadow:            inSelectMode && isSelected
                            ? '0 0 0 3px rgba(255,255,255,0.14), 0 0 22px rgba(255,255,255,0.16)'
                            : imgUrl ? '0 0 14px rgba(255,255,255,0.10)' : 'none',
                          transition: 'border-color 180ms ease, background 180ms ease, box-shadow 180ms ease',
                        }}
                        onMouseEnter={e => {
                          if (!inSelectMode && !imgUrl) {
                            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.45)';
                            (e.currentTarget as HTMLDivElement).style.background  = 'rgba(255,255,255,0.05)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!inSelectMode && !imgUrl) {
                            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.14)';
                            (e.currentTarget as HTMLDivElement).style.background  = 'rgba(255,255,255,0.030)';
                          }
                        }}
                      >
                        <input
                          ref={el => { fileRefs.current[i] = el; }}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={e => handleFileChange(i, e)}
                        />

                        {imgUrl ? (
                          <>
                            <img
                              src={imgUrl}
                              alt={`Room ${i + 1}`}
                              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                            />
                            {inSelectMode && !isSelected && selectedImage !== null && (
                              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.42)', borderRadius: '12px', zIndex: 1, transition: 'background 180ms ease' }} />
                            )}
                            {inSelectMode ? (
                              isSelected ? (
                                <div style={{ position: 'absolute', top: '8px', right: '8px', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, boxShadow: '0 0 12px rgba(255,255,255,0.55)' }}>
                                  <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
                                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </div>
                              ) : null
                            ) : (
                              <div style={{ position: 'absolute', top: '8px', right: '8px', width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <ImagePlus size={16} style={{ color: 'rgba(255,255,255,0.38)' }} />
                            </div>
                            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10.5px', fontWeight: 400, color: 'rgba(255,255,255,0.32)', textAlign: 'center', lineHeight: 1.5 }}>
                              Drop image or Browse
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {filledCount > 0 && (
                  <div style={{ padding: '0 32px 12px', flexShrink: 0 }}>
                    <label
                      htmlFor="room-context-upload"
                      style={{
                        display: 'block',
                        marginBottom: '6px',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '12px',
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.55)',
                      }}
                    >
                      {activeModal === 'external' ? 'Building or site context (optional)' : 'Room context (optional)'}
                    </label>
                    <textarea
                      id="room-context-upload"
                      value={activeModal === 'internal' ? internalRoomContext : externalRoomContext}
                      onChange={(e) =>
                        activeModal === 'internal'
                          ? setInternalRoomContext(e.target.value)
                          : setExternalRoomContext(e.target.value)
                      }
                      placeholder={
                        activeModal === 'external'
                          ? 'e.g. North-facing front, 3 floors, coastal climate…'
                          : 'e.g. Master bedroom, 12×14 ft, south light, keeping the wardrobe wall…'
                      }
                      rows={3}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                        minHeight: '72px',
                        maxHeight: '140px',
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'rgba(255,255,255,0.88)',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '12.5px',
                        lineHeight: 1.5,
                        outline: 'none',
                      }}
                    />
                  </div>
                )}

                {/* Analyzing section */}
                {showValidationProgress && (
                  <div style={{ padding: '20px 32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%' }}>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 400, color: 'rgba(255,255,255,0.40)', textAlign: 'center' }}>
                      {isValidatingImageType
                        ? 'Validating that your photos match this configuration…'
                        : 'Preparing…'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', paddingLeft: '24px', paddingRight: '24px' }}>
                      <div style={{ flex: 1, height: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', position: 'relative', overflow: 'visible' }}>
                        <div
                          className="rcs-analyze-fill"
                          style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${analyzeProgress}%`, borderRadius: '8px', background: 'linear-gradient(90deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.92) 100%)', transition: 'width 60ms linear', minWidth: analyzeProgress > 0 ? '8px' : '0' }}
                        />
                        {analyzeProgress > 0 && (
                          <div style={{ position: 'absolute', top: '50%', left: `${analyzeProgress}%`, transform: 'translate(-50%, -50%)', width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(255,255,255,0.95)', border: '2px solid rgba(255,255,255,0.80)', boxShadow: '0 0 10px rgba(255,255,255,0.85), 0 0 22px rgba(255,255,255,0.40)', zIndex: 2, transition: 'left 60ms linear' }} />
                        )}
                      </div>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.65)', minWidth: '30px', textAlign: 'right', flexShrink: 0 }}>
                        {analyzeProgress}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Post-analysis feedback */}
                {imageTypeValidation && !imageTypeValidation.valid && hasMinUploads && !isValidatingImageType && (
                  <div style={{ padding: '12px 32px 0', width: '100%' }}>
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: 'rgba(180,60,60,0.18)',
                        border: '1px solid rgba(255,120,120,0.35)',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '11.5px',
                        color: 'rgba(255,210,210,0.95)',
                        lineHeight: 1.5,
                      }}
                    >
                      {imageTypeValidation.message}
                    </div>
                  </div>
                )}

                {analysisDone && imageTypeValidation?.valid === true && (
                  <div style={{ padding: '16px 56px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '100%' }}>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 400, color: 'rgba(255,255,255,0.50)', textAlign: 'center', lineHeight: 1.55 }}>
                      Select one image as the layout reference to continue.
                    </span>
                  </div>
                )}

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', padding: '12px 32px 16px' }}>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11.5px', fontWeight: 400, color: 'rgba(255,255,255,0.28)', marginRight: 'auto' }}>
                    {filledCount} / {maxImages} uploaded
                  </span>
                  <button
                    onClick={handleCloseModal}
                    style={{ height: '40px', padding: '0 22px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.62)', transition: 'all 180ms ease' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.62)'; }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!canProceedFromUpload}
                    onClick={() => {
                      if (!canProceedFromUpload) return;
                      if (selectedConfigMode === 'arrangement') {
                        setSelectedStyleId(null);
                        setSelectedPalette(null);
                        setModalStep('preferences');
                      } else {
                        setModalStep('styleSelect');
                      }
                    }}
                    style={{ height: '40px', padding: '0 26px', borderRadius: '10px', background: canProceedFromUpload ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.04)', border: canProceedFromUpload ? '1.5px solid rgba(255,255,255,0.80)' : '1px solid rgba(255,255,255,0.08)', boxShadow: canProceedFromUpload ? '0px 0px 18px rgba(255,255,255,0.35), inset 0px 1px 2px rgba(255,255,255,0.08)' : 'none', cursor: canProceedFromUpload ? 'pointer' : 'not-allowed', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: canProceedFromUpload ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.22)', transition: 'all 200ms ease', opacity: canProceedFromUpload ? 1 : 0.55 }}
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {/* ══ STEP 1 — CHOOSE CONFIGURATION ═══════════════════ */}
            {modalStep === 'configMode' && (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 32px 0' }}>
                  <div>
                    <h2 style={{ margin: 0, marginBottom: '7px', fontFamily: "'Inter', sans-serif", fontSize: '20px', fontWeight: 600, color: '#f4f0e6', lineHeight: 1.2 }}>
                      Choose configuration
                    </h2>
                    <p style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.42)', lineHeight: 1.55 }}>
                      Pick full-room or custom components first. Next you will upload images and lock the layout reference.
                    </p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background 180ms ease' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.11)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  >
                    <X size={14} style={{ color: 'rgba(255,255,255,0.55)' }} />
                  </button>
                </div>

                <div style={{ flex: 1, minHeight: 0, padding: '18px 32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {([
                    {
                      id: 'purpose' as const,
                      title: 'Full Room Configuration',
                      desc: 'Reconfigure full room style and palette while preserving the same room layout.',
                      Icon: DoorOpen,
                    },
                    {
                      id: 'arrangement' as const,
                      title: 'Custom Room Components',
                      desc: 'Use component-based arrangement behavior from the room-configuration backend.',
                      Icon: SquarePen,
                    },
                  ]).map((opt) => {
                    const isActive = selectedConfigMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedConfigMode(opt.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          width: '100%',
                          textAlign: 'left',
                          padding: '14px 14px',
                          borderRadius: '12px',
                          border: isActive ? '1.5px solid rgba(255,255,255,0.80)' : '1px solid rgba(255,255,255,0.12)',
                          background: isActive ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)',
                          cursor: 'pointer',
                          color: '#fff',
                        }}
                      >
                        <div style={{ width: 16, height: 16, borderRadius: '50%', border: isActive ? '1px solid rgba(255,255,255,0.9)' : '1px solid rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 }}>
                          {isActive && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffffff' }} />}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <opt.Icon size={16} style={{ color: isActive ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.65)', flexShrink: 0 }} />
                            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.92)' }}>{opt.title}</div>
                          </div>
                          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', lineHeight: 1.55, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{opt.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', padding: '12px 32px 16px' }}>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    style={{ height: '40px', padding: '0 22px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.62)', transition: 'all 180ms ease' }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalStep('upload')}
                    style={{ height: '40px', padding: '0 26px', borderRadius: '10px', background: 'rgba(0,0,0,0.45)', border: '1.5px solid rgba(255,255,255,0.80)', boxShadow: '0px 0px 18px rgba(255,255,255,0.35), inset 0px 1px 2px rgba(255,255,255,0.08)', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.92)', transition: 'all 200ms ease' }}
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {/* ══ STEP 3 — STYLE SELECTION ═════════════════════════ */}
            {modalStep === 'styleSelect' && (
              <>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 32px 0' }}>
                  <div>
                    <h2 style={{ margin: 0, marginBottom: '7px', fontFamily: "'Inter', sans-serif", fontSize: '20px', fontWeight: 600, color: '#f4f0e6', lineHeight: 1.2 }}>
                      Style Selection
                    </h2>
                    <p style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.42)', lineHeight: 1.55 }}>
                      Pick a region, then a style. The AI will apply that regional look to your room.
                    </p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background 180ms ease' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.11)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  >
                    <X size={14} style={{ color: 'rgba(255,255,255,0.55)' }} />
                  </button>
                </div>

                {/* Region tabs */}
                <div
                  role="tablist"
                  aria-label="Style region"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    padding: '12px 32px 0',
                    flexShrink: 0,
                  }}
                >
                  {REGIONAL_STYLE_TABS.map((tab) => {
                    const active = styleCategoryTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setStyleCategoryTab(tab.id)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '999px',
                          border: active ? '1.5px solid rgba(255,255,255,0.85)' : '1px solid rgba(255,255,255,0.14)',
                          background: active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                          color: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)',
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '12px',
                          fontWeight: active ? 600 : 500,
                          cursor: 'pointer',
                          transition: 'all 160ms ease',
                        }}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Style grid — 4 cols, scrollable */}
                <div
                  className="rcs-style-grid"
                  style={{
                    flex:                '1',
                    minHeight:           0,
                    padding:             '14px 32px',
                    display:             'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    columnGap:           '16px',
                    rowGap:              '16px',
                    overflowY:           'auto',
                    alignContent:        'start',
                  }}
                >
                  {stylesInCategory.map((style) => {
                    const isSel = selectedStyleId === style.id;
                    return (
                      <div
                        key={style.id}
                        onClick={() => setSelectedStyleId(style.id)}
                        style={{
                          display:       'flex',
                          flexDirection: 'column',
                          alignItems:    'center',
                          cursor:        'pointer',
                        }}
                      >
                        <div style={{
                          width:        '100px',
                          height:       '100px',
                          borderRadius: '50%',
                          overflow:     'hidden',
                          flexShrink:   0,
                          border:       isSel
                            ? '2px solid rgba(255,255,255,0.82)'
                            : '1.5px solid rgba(255,255,255,0.18)',
                          boxShadow:    isSel ? '0 0 14px rgba(255,255,255,0.28)' : 'none',
                          transition:   'all 180ms ease',
                        }}>
                          <img
                            src={style.img}
                            alt={style.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        </div>

                        <span style={{
                          marginTop:  '8px',
                          maxWidth:   '112px',
                          fontFamily: "'Inter', sans-serif",
                          fontSize:   '12px',
                          fontWeight: isSel ? 500 : 400,
                          color:      isSel ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.50)',
                          textAlign:  'center',
                          lineHeight: 1.35,
                          transition: 'all 180ms ease',
                        }}>
                          {style.name}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', padding: '12px 32px 16px' }}>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11.5px', fontWeight: 400, color: 'rgba(255,255,255,0.28)', marginRight: 'auto' }}>
                    {selectedRegionalStyle ? `"${selectedRegionalStyle.name}" selected` : 'No style selected'}
                  </span>
                  <button
                    onClick={() => setModalStep('upload')}
                    style={{ height: '40px', padding: '0 22px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.62)', transition: 'all 180ms ease' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.62)'; }}
                  >
                    Back
                  </button>
                  <button
                    disabled={!selectedStyleId}
                    onClick={() => { if (selectedStyleId) setModalStep('paletteSelect'); }}
                    style={{ height: '40px', padding: '0 26px', borderRadius: '10px', background: selectedStyleId ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.04)', border: selectedStyleId ? '1.5px solid rgba(255,255,255,0.80)' : '1px solid rgba(255,255,255,0.08)', boxShadow: selectedStyleId ? '0px 0px 18px rgba(255,255,255,0.35), inset 0px 1px 2px rgba(255,255,255,0.08)' : 'none', cursor: selectedStyleId ? 'pointer' : 'not-allowed', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: selectedStyleId ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.22)', transition: 'all 200ms ease', opacity: selectedStyleId ? 1 : 0.55 }}
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {/* ══ STEP 4 — PALETTE SELECTION ═══════════════════════ */}
            {modalStep === 'paletteSelect' && (
              <>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 32px 0' }}>
                  <div>
                    <h2 style={{ margin: 0, marginBottom: '7px', fontFamily: "'Inter', sans-serif", fontSize: '20px', fontWeight: 600, color: '#f4f0e6', lineHeight: 1.2 }}>
                      Select a color palette
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.32)', marginLeft: '8px' }}>(Optional)</span>
                    </h2>
                    <p style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.42)', lineHeight: 1.55 }}>
                      Choose a color palette to guide the AI.
                    </p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background 180ms ease' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.11)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  >
                    <X size={14} style={{ color: 'rgba(255,255,255,0.55)' }} />
                  </button>
                </div>

                {/* Palette grid — 3 cols square cards, scrollable */}
                <div
                  className="rcs-style-grid"
                  style={{
                    flex:                '1',
                    minHeight:           0,
                    padding:             '12px 32px',
                    display:             'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gridAutoRows:        'auto',
                    columnGap:           '16px',
                    rowGap:              '20px',
                    overflowY:           'auto',
                    alignContent:        'start',
                  }}
                >
                  {PALETTES.map(palette => {
                    const isSel = selectedPalette === palette.name;
                    const isHovered = hoveredPalette === palette.name;
                    return (
                      /* Transparent column wrapper — no border/background here */
                      <div
                        key={palette.name}
                        onClick={() => setSelectedPalette(isSel ? null : palette.name)}
                        onMouseEnter={() => setHoveredPalette(palette.name)}
                        onMouseLeave={() => setHoveredPalette(null)}
                        style={{
                          display:       'flex',
                          flexDirection: 'column',
                          alignItems:    'center',
                          cursor:        'pointer',
                          padding:       '8px',
                          borderRadius:  '12px',
                          border:        '1.5px solid transparent',
                          margin:        '-8px',
                        }}
                      >
                        {/* Gradient swatch — floating box with no outer card */}
                        <div
                          style={{
                            width:        '100px',
                            height:       '100px',
                            borderRadius: '12px',
                            background:   getPaletteGradient(palette.name, palette.colors),
                            border:       isSel ? '2px solid rgba(255,255,255,0.70)' : 'none',
                            boxShadow:    isSel ? '0 0 12px rgba(255,255,255,0.15)' : 'none',
                            transition:   'all 180ms ease',
                            flexShrink:   0,
                          }}
                        />

                        {/* Palette name — outside the box, 8px below */}
                        <div style={{
                          marginTop:  '8px',
                          fontFamily: "'Inter', sans-serif",
                          fontSize:   '11px',
                          fontWeight: isSel ? 500 : 400,
                          color:      isSel ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.72)',
                          lineHeight: 1.3,
                          textAlign:  'center',
                          transition: 'color 180ms ease',
                          width:      '100%',
                          whiteSpace: 'normal',
                          wordBreak:  'break-word',
                        }}>
                          {palette.name}
                        </div>

                        {/* Subtitle — outside the box, 4px below name */}
                        <div style={{
                          marginTop:  '4px',
                          fontFamily: "'Inter', sans-serif",
                          fontSize:   '12px',
                          fontWeight: 400,
                          color:      '#9CA3AF',
                          lineHeight: 1.3,
                          textAlign:  'center',
                          width:      '100%',
                          whiteSpace: 'normal',
                          wordBreak:  'break-word',
                        }}>
                          {palette.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', padding: '12px 32px 16px' }}>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11.5px', fontWeight: 400, color: 'rgba(255,255,255,0.28)', marginRight: 'auto' }}>
                    {selectedPalette ? `"${selectedPalette}" selected` : 'No palette selected'}
                  </span>
                  <button
                    onClick={() => setModalStep('styleSelect')}
                    style={{ height: '40px', padding: '0 22px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.62)', transition: 'all 180ms ease' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.62)'; }}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setModalStep('preferences')}
                    style={{ height: '40px', padding: '0 26px', borderRadius: '10px', background: 'rgba(0,0,0,0.45)', border: '1.5px solid rgba(255,255,255,0.80)', boxShadow: '0px 0px 18px rgba(255,255,255,0.35), inset 0px 1px 2px rgba(255,255,255,0.08)', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.92)', transition: 'all 200ms ease' }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0px 0px 26px rgba(255,255,255,0.48), inset 0px 1px 2px rgba(255,255,255,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0px 0px 18px rgba(255,255,255,0.35), inset 0px 1px 2px rgba(255,255,255,0.08)'; }}
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {/* ══ STEP 5 — PREFERENCES ═══════════════════════ */}
            {modalStep === 'preferences' && (
              <>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px 32px 0' }}>
                  <div>
                    <h2 style={{ margin: 0, marginBottom: '7px', fontFamily: "'Inter', sans-serif", fontSize: '20px', fontWeight: 600, color: '#f4f0e6', lineHeight: 1.2 }}>
                      Reference Images & Preferences
                    </h2>
                    <p style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.42)', lineHeight: 1.55 }}>
                      Upload reference images and add any additional notes (optional)
                    </p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background 180ms ease' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.11)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  >
                    <X size={14} style={{ color: 'rgba(255,255,255,0.55)' }} />
                  </button>
                </div>

                {/* Content area */}
                <div style={{ flex: 1, minHeight: 0, padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                  {/* Upload Reference Images Button */}
                  <input
                    ref={preferenceRefInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handlePreferenceReferenceUpload}
                  />
                  <button
                    type="button"
                    onClick={() => preferenceRefInputRef.current?.click()}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      padding: '12px 20px', 
                      borderRadius: '10px', 
                      background: 'rgba(0,0,0,0.45)', 
                      border: '1px solid rgba(255,255,255,0.18)', 
                      cursor: 'pointer', 
                      fontFamily: "'Inter', sans-serif", 
                      fontSize: '13px', 
                      fontWeight: 500, 
                      color: 'rgba(255,255,255,0.92)', 
                      transition: 'all 180ms ease',
                      alignSelf: 'flex-start'
                    }}
                    onMouseEnter={e => { 
                      e.currentTarget.style.background = 'rgba(0,0,0,0.55)'; 
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)'; 
                    }}
                    onMouseLeave={e => { 
                      e.currentTarget.style.background = 'rgba(0,0,0,0.45)'; 
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; 
                    }}
                  >
                    <Upload size={16} style={{ color: 'inherit' }} />
                    Upload Reference Images
                  </button>
                  {preferenceReferenceImages.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
                      {preferenceReferenceImages.map((src, i) => (
                        <div key={`${src}-${i}`} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
                          <img src={src} alt={`Reference ${i + 1}`} style={{ width: '100%', height: '92px', objectFit: 'cover', display: 'block' }} />
                          <button
                            type="button"
                            onClick={() => removePreferenceReferenceImage(i)}
                            style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 999, border: '1px solid rgba(255,255,255,0.35)', background: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer', fontSize: 12, lineHeight: '18px', textAlign: 'center', padding: 0 }}
                            title="Remove reference"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Additional Notes Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                      Additional Notes
                    </label>
                    <p style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 400, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginTop: '-6px' }}>
                      Describe your vision, preferred materials, budget range, or any specific requirements.
                    </p>
                    <textarea
                      value={preferenceAdditionalNotes}
                      onChange={(e) => setPreferenceAdditionalNotes(e.target.value)}
                      placeholder="e.g. Indian Rajasthani touch, warm terracotta accents, carved wood details, local crafts…"
                      style={{
                        width: '100%',
                        minHeight: '140px',
                        padding: '14px 16px',
                        borderRadius: '10px',
                        background: 'rgba(0,0,0,0.35)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '13px',
                        fontWeight: 400,
                        color: 'rgba(255,255,255,0.92)',
                        lineHeight: 1.6,
                        resize: 'vertical',
                        outline: 'none',
                        transition: 'border-color 180ms ease, background 180ms ease'
                      }}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)';
                        e.currentTarget.style.background = 'rgba(0,0,0,0.45)';
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                        e.currentTarget.style.background = 'rgba(0,0,0,0.35)';
                      }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '10px', padding: '12px 32px 16px' }}>
                  {wizardSubmitError && (
                    <div
                      style={{
                        padding:      '10px 12px',
                        borderRadius: '8px',
                        background:   'rgba(180,60,60,0.2)',
                        border:       '1px solid rgba(255,120,120,0.35)',
                        fontFamily:   "'Inter', sans-serif",
                        fontSize:     '12px',
                        color:        'rgba(255,210,210,0.95)',
                        lineHeight:   1.4,
                      }}
                    >
                      {wizardSubmitError}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                      type="button"
                      disabled={wizardSubmitting}
                      onClick={() =>
                        setModalStep(selectedConfigMode === 'arrangement' ? 'upload' : 'paletteSelect')
                      }
                      style={{ height: '40px', padding: '0 22px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', cursor: wizardSubmitting ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.62)', transition: 'all 180ms ease', opacity: wizardSubmitting ? 0.5 : 1 }}
                      onMouseEnter={e => { if (wizardSubmitting) return; e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.62)'; }}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={wizardSubmitting}
                      onClick={() => {
                        void (async () => {
                          setWizardSubmitError(null);
                          const slots = uploadedImages
                            .map((u, i) => ({ u, i }))
                            .filter((x): x is { u: string; i: number } => x.u != null && x.u !== '');
                          const blobUrls = slots.map((x) => x.u);
                          const layoutIdx =
                            selectedImage !== null && uploadedImages[selectedImage]
                              ? slots.findIndex((s) => s.i === selectedImage)
                              : 0;
                          const safeLayout = layoutIdx >= 0 ? layoutIdx : 0;
                          const configType = activeModal === 'external' ? 'external' : 'internal';
                          const ctx =
                            configType === 'external' ? externalRoomContext.trim() : internalRoomContext.trim();
                          const notes = preferenceAdditionalNotes.trim();
                          const arrangementPreferencesText =
                            notes ||
                            ctx ||
                            'Create a practical component-based arrangement with balanced spacing and clear circulation.';
                          const payload: RoomWizardCompletePayload = {
                            blobUrls,
                            configMode: selectedConfigMode,
                            ...(selectedConfigMode === 'arrangement' ? { omitWizardStyleAndPalette: true } : {}),
                            ...(preferenceReferenceImages.length > 0
                              ? { referenceImageBlobUrls: preferenceReferenceImages }
                              : {}),
                            layoutIndex: safeLayout,
                            style:
                              selectedConfigMode === 'arrangement'
                                ? ''
                                : selectedRegionalStyle?.name ?? DEFAULT_REGIONAL_STYLE_NAME,
                            paletteName: selectedConfigMode === 'arrangement' ? null : selectedPalette,
                            configType,
                            ...(selectedConfigMode === 'arrangement'
                              ? {
                                  arrangementConfig: {
                                    existingComponentsNote:
                                      'Preserve major existing components and spatial anchors from the selected layout image unless user preferences indicate changes.',
                                    removedComponentsNote: '',
                                    newComponentsNote:
                                      preferenceReferenceImages.length > 0
                                        ? 'Add new components inspired by the provided reference images where appropriate.'
                                        : 'Add suitable components to complete the room arrangement.',
                                    arrangementPreferencesText,
                                  },
                                }
                              : {}),
                            ...(ctx ? { roomContext: ctx } : {}),
                            ...(notes ? { additionalNotes: notes } : {}),
                          };
                          setWizardSubmitting(true);
                          try {
                            await onComplete?.(payload);
                            handleCloseModal();
                          } catch (err) {
                            setWizardSubmitError(err instanceof Error ? err.message : 'Generation failed. Check Next.js is running and try again.');
                          } finally {
                            setWizardSubmitting(false);
                          }
                        })();
                      }}
                      style={{ height: '40px', padding: '0 26px', borderRadius: '10px', background: wizardSubmitting ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.45)', border: '1.5px solid rgba(255,255,255,0.80)', boxShadow: '0px 0px 18px rgba(255,255,255,0.35), inset 0px 1px 2px rgba(255,255,255,0.08)', cursor: wizardSubmitting ? 'wait' : 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.92)', transition: 'all 200ms ease' }}
                      onMouseEnter={e => { if (wizardSubmitting) return; e.currentTarget.style.boxShadow = '0px 0px 26px rgba(255,255,255,0.48), inset 0px 1px 2px rgba(255,255,255,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0px 0px 18px rgba(255,255,255,0.35), inset 0px 1px 2px rgba(255,255,255,0.08)'; }}
                    >
                      {wizardSubmitting ? 'Preparing…' : 'Generate & Configure'}
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}