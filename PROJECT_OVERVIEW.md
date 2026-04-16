# AI Room Configuration — Project Overview

This document describes repository structure, AI models, external services, API routes, and how to think about cost. For environment variables, see `.env.example` in the project root.

---

## 1. Repository layout

| Path | Role |
|------|------|
| **Root** (`package.json`) | **Next.js 14** application. Server-side AI runs in `app/api/*`. |
| **`Internalconfigf/`** | **Vite + React** UI (e.g. port 5173). Calls the Next app (typically **port 3000**) for `/api/*`. |
| **`app/`** | Pages (`app/page.tsx`), components, Zustand store, room editor libraries, server utilities. |
| **`supabase/migrations/`** | SQL migrations for catalog data (tiles, sofas, lighting, chairs, tables, decor, etc.). |
| **`lift subject/`** | Separate Vite-based experiment; uses its own Gemini env vars (`VITE_*`). Not the main Next deployment path. |
| **`scripts/`** | Helper scripts (e.g. seed generation). |
| **`vercel.json`** | API route **maxDuration** 300s for `app/api/**/*.ts`. |

**Primary stack (production path):** Next.js API + React UI (main app and/or Internalconfigf as client).

---

## 2. Dependencies (root `package.json`)

| Package | Use |
|---------|-----|
| `next`, `react`, `react-dom` | App framework and UI. |
| `@runwayml/sdk` | Room tour video (`/api/room-tour-video`). |
| `@supabase/supabase-js` | Database and storage (catalogs, tour temp uploads). |
| `sharp` | Image resize, compositing, JPEG/PNG processing server-side. |
| `undici` | HTTP client usage where applicable. |
| `zustand` | Client state. |

**Internalconfigf** has its own `package.json` (Vite, MUI, Radix, etc.) — UI only; AI is still on Next APIs when wired that way.

---

## 3. Environment variables (summary)

| Variable | Required for | Notes |
|----------|----------------|-------|
| `IMAGE_GENERATION_API_KEY` | Gemini on Next server | Without it, `/api/generate` can return placeholder behavior (see route implementation). |
| `GEMINI_TEXT_MODEL` | Text / vision-text calls | Default in code: `gemini-2.5-flash`. |
| `GEMINI_IMAGE_MODEL` | Image generation & inpaint | Default: `gemini-3-pro-image-preview`. |
| `GEMINI_IMAGE_TIMEOUT_MS` | Inpaint / heavy image calls | Optional; max wait for Gemini image (e.g. 60s–600s). |
| `RUNWAYML_API_SECRET` | `/api/room-tour-video` | Runway Gen-4 Turbo image-to-video. |
| `ROOM_TOUR_STORAGE_BUCKET` | Tour video flow | Supabase bucket for temporary first-frame JPEG. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server uploads / privileged ops | Keep server-only. |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server Supabase access | Public anon key is exposed to browser. |
| `SEGMENTATION_API_KEY`, `SEGMENTATION_API_URL` | `/api/segment` | Your SAM-compatible endpoint. |
| `GROUNDING_DINO_API_KEY`, `GROUNDING_DINO_API_URL` | `/api/detect-objects` | Your detection endpoint. |
| `RUNWAY_VIDEO_DURATION`, `RUNWAY_VIDEO_RATIO`, `RUNWAY_VIDEO_SEED` | Optional Runway tunables | Defaults: 10s, `1280:720`. |

Optional / legacy mentions in `.env.example`: `STABILITY_AI_API_KEY`, `REPLICATE_API_TOKEN` — not the primary path for the main `generate` flow (Gemini + Imagen fallback in code).

---

## 4. AI models and where they are used

### 4.1 Google Gemini (primary)

| Model ID (typical) | Env override | Used for |
|--------------------|--------------|----------|
| `gemini-2.5-flash` | `GEMINI_TEXT_MODEL` | Prompt structuring, validation, component detection text, analysis routes. |
| `gemini-3-pro-image-preview` | `GEMINI_IMAGE_MODEL` | Full room image generation; masked inpaint (add / edit / replace / erase) via `app/lib/server/geminiInpaintMask.ts`. |
| `imagen-4.0-generate-001` | *(hardcoded fallback in `app/api/generate/route.ts`)* | Fallback if primary image model fails. |

**API base:** `generativelanguage.googleapis.com` (`/v1` or `/v1beta` depending on call).

### 4.2 Runway

| Field | Value |
|-------|--------|
| SDK | `@runwayml/sdk` |
| Model | `gen4_turbo` (image-to-video) |
| Route | `POST/GET /api/room-tour-video` |

### 4.3 Optional external HTTP APIs (you host or subscribe)

- **Segmentation:** `/api/segment` → `SEGMENTATION_API_URL` (SAM-style masks).
- **Object detection:** `/api/detect-objects` → `GROUNDING_DINO_API_URL`.

---

## 5. Next.js API routes (quick map)

| Route | Primary backend |
|-------|------------------|
| `/api/generate` | Gemini text + Gemini image; Imagen fallback; highest volume for “full room” generations. |
| `/api/add`, `/api/edit`, `/api/replace`, `/api/erase` | Gemini image (masked inpaint) + `sharp` compositing. |
| `/api/edit-cutout` | Gemini + image processing (see file). |
| `/api/validate-image-type` | Gemini text. |
| `/api/detect-components` | Gemini text. |
| `/api/detect-objects` | External detection API. |
| `/api/segment` | External segmentation API. |
| `/api/analyze-room`, `/api/analyze-external` | Room/property analysis (Gemini in route). |
| `/api/room-tour-video` | Runway + Supabase signed URL for first frame. |
| `/api/product-variations`, `/api/mytyles-vitrified-tiles` | Supabase / catalog reads. |

---

## 6. Cost guidance (usage-based; not a fixed project fee)

Exact spend depends on:

- Google billing tier, free credits, and **per-model** pricing.
- Runway plan and per-generation charges.
- Supabase plan and storage/egress.
- Your third-party segmentation/detection provider.

### 6.1 How to estimate Gemini

- **Each full `/api/generate` success path** often involves **at least one text generation** and **one image generation** (plus possible retries or Imagen fallback).
- **Each add/replace/erase/edit inpaint** is typically **one or more image-model calls** per user action (retries may add more).

**Official pricing:** [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing) — match the **exact model strings** you set in `GEMINI_TEXT_MODEL` and `GEMINI_IMAGE_MODEL`.

### 6.2 Runway

- Charged **per video job** (model, duration, resolution).  
- **Reference:** [Runway pricing](https://runwayml.com/pricing) for Gen-4 / Turbo.

### 6.3 Supabase

- Generally smaller than AI at moderate scale unless you store large media or have high egress.

### 6.4 Simple monthly formula (fill in your averages)

```
Monthly estimate ≈
  (room_generations × cost_per_generate)
+ (inpaint_operations × cost_per_inpaint)
+ (tour_videos × cost_per_video)
+ Supabase_subscription
+ segmentation_detection_calls × provider_unit_price
```

Export usage from **Google Cloud / AI Studio billing**, **Runway dashboard**, and **Supabase** usage reports to calibrate `cost_per_*`.

---

## 7. Security

- Never commit `.env.local` or real API keys.
- Rotate any key that was ever pasted into chat, docs, or screenshots.
- Restrict `SUPABASE_SERVICE_ROLE_KEY` to server-only code.

---

## 8. Related files

| File | Content |
|------|---------|
| `.env.example` | Variable names and comments. |
| `app/api/generate/route.ts` | Main generation pipeline, model names, timeouts, fallbacks. |
| `app/lib/server/geminiInpaintMask.ts` | Inpaint model ID and timeout helper. |
| `app/api/room-tour-video/route.ts` | Runway `gen4_turbo`, duration/ratio parsing. |

---

*Last updated from codebase scan (structure and env names may drift; verify against source if something fails after an upgrade.)*

---

## PDF export

A printable copy is kept in the repo root as **`PROJECT_OVERVIEW.pdf`** (regenerate after editing this file).

**Regenerate (Windows, Microsoft Edge required):**

```bash
npm run pdf:overview
```

This runs `scripts/render-overview-pdf.mjs` (Markdown → HTML → PDF). If Edge is not installed, open the generated `PROJECT_OVERVIEW.html` in any browser and use **Print → Save as PDF**.
