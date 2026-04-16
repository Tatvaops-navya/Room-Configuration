# AI Room Configuration System – Codebase Analysis

## 1. Project overview

| Item | Detail |
|------|--------|
| **Stack** | Next.js 14 (App Router), React 18, TypeScript |
| **Key deps** | @supabase/supabase-js, sharp, undici |
| **Entry** | `app/page.tsx` (single-page wizard), `app/api/*` (API routes) |

---

## 2. High-level structure

```
app/
├── page.tsx                 # Main wizard UI, state, generate handlers
├── layout.tsx
├── globals.css
├── components/
│   ├── ImageUpload.tsx
│   ├── ConfigurationSelector.tsx   # Step 4: purpose / customization (arrangement gated)
│   ├── StyleSelector.tsx
│   ├── ColorPaletteSelector.tsx
│   ├── FullRoomReferenceUpload.tsx
│   ├── ComponentReferenceUpload.tsx
│   ├── BeforeAfterSlider.tsx
│   ├── VastuQuestionnaire.tsx
│   ├── ResultDisplay.tsx
│   └── ...
├── api/
│   ├── generate/route.ts     # Main image generation (Gemini + Imagen, resize)
│   ├── analyze-room/route.ts
│   ├── analyze-external/route.ts
│   ├── validate-image-type/route.ts
│   ├── product-variations/route.ts
│   └── detect-components/route.ts
├── utils/
│   ├── promptBuilder.ts
│   ├── compressImage.ts
│   ├── downloadWithLogo.ts
│   └── externalCustomizationPresets.ts
└── lib/
    └── supabase.ts
```

---

## 3. User flow (as implemented)

- **Step 1:** Choose **Internal** or **External** (no Vastu button in UI; type still includes `'vastu'` in code).
- **Step 2:** Upload images (min 4 internal / 3 external); optional image-type validation.
- **Step 3:** Select **layout reference** (one image).
- **Step 4:** **ConfigurationSelector** offers:
  - **Full room (purpose)** – style, optional refs/text, palette.
  - **Customization** – per-element options (wall, floor, ceiling, etc.; internal only).
  - **Arrangement** – only if `componentBasedConfigEnabled === true` (currently **false** in `ConfigurationSelector.tsx`), so arrangement is **hidden** in UI but still in types and API.

Result: generate → before/after slider, history, download, customize/edit, restart.

---

## 4. Configuration types and modes

| Concept | Where | Notes |
|--------|--------|------|
| **configType** | `page.tsx` | `'internal' \| 'external' \| 'vastu' \| null`. Step 1 UI only sets internal/external. |
| **configMode** | `page.tsx` | `'purpose' \| 'arrangement' \| 'customization'`. Step 4; arrangement hidden by flag. |
| **Arrangement** | `ConfigurationSelector.tsx` | `componentBasedConfigEnabled = false` → arrangement radio and content not shown; effect is “purpose + customization only”. |
| **Vastu** | `page.tsx` | No Step 1 button; all `configType === 'vastu'` branches (questionnaire, generate, copy) still in code. |

---

## 5. APIs

| Route | Purpose |
|-------|--------|
| `POST /api/generate` | Build prompt, call Gemini (text) + Gemini/Imagen (image), optional resize to input size, return image. Handles purpose, arrangement, customization, style-only, Vastu payload. |
| `POST /api/analyze-room` | Room/structure + components from images (arrangement path). |
| `POST /api/analyze-external` | External/structure analysis (arrangement path). |
| `POST /api/validate-image-type` | Internal vs external image type check. |
| `GET /api/product-variations` | Tile/options by component (Supabase); used in customization. |
| `POST /api/detect-components` | Components from current image; used when opening Customize. |

---

## 6. Generate flow (backend)

- **Input:** `configType`, `configMode`, `images`, `layoutImageIndex`, plus mode-specific (purposeInput, fullRoomReferenceImages, arrangementConfig, customizationStyles/Labels, externalCustomization, currentResultImage, style/palette).
- **Customization:** Uses single image (`currentResultImage`), fetches/parses floor & wall tile refs (data URL or HTTP), adds “no text in output” and floor-replacement rules.
- **Style-only:** Single image + new style/palette.
- **Other:** Uses `images`; if locked layout, only `images[layoutImageIndex]`.
- **Image model:** Primary `gemini-3-pro-image-preview`, fallback `imagen-4.0-generate-001`; optional aspect ratio for supported models; **resize to input dimensions** (sharp) before return.
- **Output:** `{ imageUrl [, warning ] }`.

---

## 7. State (page.tsx) – relevant to flow

- Wizard: `wizardStep`, `layoutReferenceImageIndex`, `configType`, `configMode`.
- Images: `images`, `fullRoomReferenceImages`, `imageTypeValidation`.
- Purpose: `fullRoomText`, `selectedStyle`, `selectedColorPalette`.
- Arrangement: `arrangementConfig`, `detectedComponents`, `componentDecisions`, `addNewComponents`, `componentReferenceImages`, `componentReferenceLabels`, `isAnalyzing`, `analysisFullReport`.
- Customization: `customStyles`, `customActions`, `productVariations`, `detectedCustomizationComponents`, etc.
- External: `externalCustomization`, `externalProductVariations`, etc.
- Vastu: `vastuEnabled`, `vastuPreferences`.
- Result: `generatedImage`, `generatedImageOriginal`, `comparisonBeforeImageUrl`, `comparisonSliderKey`, `generationHistory`, `favoriteImages`, `generatedImageHistory`, etc.

---

## 8. Align with “flow diagram” (Vastu + Arrangement removed)

To match the desired flow (Internal/External only; Full room + Customization only):

1. **Vastu**
   - **Already:** Step 1 has no Vastu button.
   - **Optional cleanup:** Remove `'vastu'` from `ConfigType`; remove all `configType === 'vastu'` branches (Step 3 label, Step 4 Vastu questionnaire, generate button, handleGenerateVastu, Vastu explanation panel, etc.); remove or keep `VastuQuestionnaire` for future use.

2. **Arrangement**
   - **Already:** Step 4 hides arrangement via `componentBasedConfigEnabled = false`.
   - **Optional cleanup:** Remove arrangement from `configMode` type and from `ConfigurationSelector` (only purpose + customization); remove arrangement-only validation and payload in `handleGenerate` and in `/api/generate`; simplify `canGenerate` and step labels so they never depend on arrangement.

3. **APIs**
   - **Optional:** Stop calling `analyze-room` / `analyze-external` if arrangement is removed; leave `/api/generate` arrangement branch or remove it for clarity.

---

## 9. Risks / notes

- **Vastu:** Still reachable if `configType` is ever set to `'vastu'` (e.g. via devtools or future UI). Full removal requires type and branch cleanup.
- **Arrangement:** Code and API still support it; only UI is gated. Removing from types and API would simplify payloads and validation.
- **Generate payload:** Always sends `configMode`; backend validates purpose/arrangement/customization. If arrangement is removed, validation and prompt branches for arrangement can be removed.

---

## 10. Summary

| Flow element | Current state |
|--------------|----------------|
| Step 1 | Internal + External only (no Vastu in UI) |
| Step 4 modes | Purpose + Customization visible; Arrangement hidden by flag |
| Vastu | No UI entry; type and logic still present |
| Arrangement | Hidden in UI; type and API still present |
| Generate | Single endpoint; supports purpose, arrangement, customization, style-only; resize to input size; no text/tile names in output |

To fully match the “no Vastu, no Arrangement” flow diagram: remove Vastu from types and all branches, and remove Arrangement from config mode and related validation/payload/prompt branches.
