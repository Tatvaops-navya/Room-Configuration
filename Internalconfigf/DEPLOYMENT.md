# Deploy `Internalconfigf` On Vercel

This app is a standalone Vite frontend. In production it should call the deployed root Next.js backend with `VITE_API_BASE_URL`.

## Vercel settings

- Framework preset: `Vite`
- Root directory: `Internalconfigf`
- Build command: `npm run build`
- Output directory: `dist`

## Required environment variable

```bash
VITE_API_BASE_URL=https://your-root-next-app.vercel.app
```

## Local development

For local development you can keep using the Vite proxy:

```bash
VITE_NEXT_ORIGIN=http://localhost:3000
```

Then run:

```bash
npm run dev:all
```

## Backend requirements

The deployed backend must allow this frontend origin through `CORS_ALLOWED_ORIGINS`.

Example:

```bash
CORS_ALLOWED_ORIGINS=https://your-internalconfigf-app.vercel.app
```
