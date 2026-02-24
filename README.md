# AI Room Configuration System

A Next.js prototype for generating realistic interior room images based on multiple room photos and user configuration preferences.

## Features

- Upload multiple room images (minimum 4)
- Two configuration modes: Purpose-based and Arrangement-based
- Vastu preference toggle
- AI-powered image generation
- Shuffle layout functionality

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Configuration

### Required: Gemini API Key

The system uses Google Gemini API to analyze room images and enhance prompts. Your API key is already configured.

### Optional: Image Generation API Keys

For **actual image generation** (modifying room images based on your inputs), add one of these to `.env.local`:

- **Stability AI** (Recommended): Get API key from https://platform.stability.ai/
- **Replicate**: Get API token from https://replicate.com/

See `API_KEY_SETUP.md` for detailed instructions.

**How it works:**
1. Gemini analyzes your room images and creates detailed configuration descriptions
2. Stability AI or Replicate generates the modified room image based on your configuration
3. Without image generation API keys, the system will analyze and log changes but return the original image

The system is fully implemented and ready to generate modified images once you add an image generation API key!

## Deploy on Vercel

This project is **Vercel-ready**. See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for:

- One-click deploy from GitHub
- Required environment variables (`IMAGE_GENERATION_API_KEY`, etc.)
- Function timeout notes (Pro plan recommended for image generation)
