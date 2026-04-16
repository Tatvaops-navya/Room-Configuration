# Deploy Both Apps On Vercel

This repository can now be deployed as two separate Vercel projects:

1. Root Next.js app at the repo root.
2. `Internalconfigf` Vite app with `Internalconfigf` as its Vercel root directory.

The Vite app should call the deployed Next.js backend explicitly through `VITE_API_BASE_URL`.

## 1. Deploy the root Next.js app

Import the repository in Vercel with the root directory set to the repository root.

### Required backend environment variables

Add these in the root Vercel project:

| Name | Required | Purpose |
|------|----------|---------|
| `IMAGE_GENERATION_API_KEY` | Yes | Gemini image and analysis routes |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase client URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes for full product/video features | Server-side Supabase access |
| `RUNWAYML_API_SECRET` | Required for room tour video | Runway video generation |
| `ROOM_TOUR_STORAGE_BUCKET` | Required for room tour video | Temporary frame storage |
| `SEGMENTATION_API_KEY` | Required for click segmentation | SAM proxy |
| `SEGMENTATION_API_URL` | Required for click segmentation | SAM proxy |
| `GROUNDING_DINO_API_KEY` | Required for hover detection | Detection proxy |
| `GROUNDING_DINO_API_URL` | Required for hover detection | Detection proxy |
| `CORS_ALLOWED_ORIGINS` | Required when `Internalconfigf` is on another domain | Comma-separated allowed frontend origins |

Optional backend variables:

| Name | Purpose |
|------|---------|
| `GEMINI_TEXT_MODEL` | Override Gemini text model |
| `GEMINI_IMAGE_MODEL` | Override Gemini image model |
| `GEMINI_IMAGE_TIMEOUT_MS` | Tune long-running inpaint routes |
| `RUNWAY_VIDEO_DURATION` | Runway video duration |
| `RUNWAY_VIDEO_RATIO` | Runway aspect ratio |
| `RUNWAY_VIDEO_SEED` | Runway deterministic seed |

### Backend notes

- `vercel.json` and `app/api/generate/route.ts` are aligned to a `300` second max duration for long AI requests.
- These routes are not suitable for the Vercel Hobby plan if you expect long-running image/video operations. Use a plan that supports the configured function durations.
- The new `middleware.ts` enables cross-origin API access for configured frontend origins and handles API preflight requests.

## 2. Deploy the `Internalconfigf` Vite app

Create a second Vercel project from the same repository and set the root directory to `Internalconfigf`.

### Frontend environment variables

Add these in the `Internalconfigf` Vercel project:

| Name | Required | Purpose |
|------|----------|---------|
| `VITE_API_BASE_URL` | Yes | Public URL of the deployed root Next.js app |

Optional for local development only:

| Name | Purpose |
|------|---------|
| `VITE_NEXT_ORIGIN` | Vite dev proxy target for local Next.js development |

### Frontend notes

- `Internalconfigf` no longer depends on same-origin `/api/*` in production.
- Figma assets prefer the app-local `public/figma-assets` copy so the Vite project can build independently.
- The watermark/logo helper is local to `Internalconfigf`, and the app serves its own `public/tatva-ops-logo.svg`.

## Recommended order

1. Deploy the root Next.js app first.
2. Copy the root deployment URL into `Internalconfigf` as `VITE_API_BASE_URL`.
3. Add the `Internalconfigf` Vercel URL to `CORS_ALLOWED_ORIGINS` in the root project.
4. Redeploy both projects after saving env vars.

## Optional: deploy with Vercel CLI

```bash
npm i -g vercel
vercel
```
