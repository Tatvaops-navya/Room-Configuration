# Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Open Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
room-configuration/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts          # API endpoint for image generation
│   ├── components/
│   │   ├── ImageUpload.tsx        # Image upload component
│   │   ├── ConfigurationSelector.tsx  # Configuration mode selector
│   │   └── ResultDisplay.tsx      # Result display component
│   ├── utils/
│   │   └── promptBuilder.ts       # AI prompt construction utility
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main page component
├── package.json
├── tsconfig.json
└── next.config.js
```

## How It Works

### 1. Image Upload Flow
- User uploads minimum 4 images of the same room
- Images are converted to base64 for easy handling
- Preview grid shows all uploaded images
- Generation button is disabled until 4 images are uploaded

### 2. Configuration Selection
- **Purpose-based**: User provides natural language description (e.g., "Workspace for 15 members")
- **Arrangement-based**: User provides structured inputs (desks, type, collaboration area, storage)

### 3. Vastu Toggle
- When enabled, Vastu guidance text is added to the AI prompt
- No actual direction calculations - just instructional text

### 4. Image Generation
- API route receives images and configuration
- Prompt builder constructs AI prompt dynamically
- Placeholder function returns first image (replace with actual AI API call)
- Generated image is displayed

### 5. Shuffle Layout
- Regenerates image with same inputs but different arrangement
- Uses shuffle flag in prompt

## Integrating Real AI Image Generation

To use actual AI image generation, modify `app/api/generate/route.ts`:

1. **Add API Key** to `.env.local`:
   ```
   IMAGE_GENERATION_API_KEY=your_key_here
   ```

2. **Replace `generateImageWithAI` function** with actual API call:

   Example for Stability AI:
   ```typescript
   const response = await fetch('https://api.stability.ai/v1/image-to-image', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${apiKey}`,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       image: images[0],
       prompt: prompt,
       strength: 0.7,
     }),
   })
   ```

   Example for Replicate:
   ```typescript
   const response = await fetch('https://api.replicate.com/v1/predictions', {
     method: 'POST',
     headers: {
       'Authorization': `Token ${apiKey}`,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       version: 'model_version_id',
       input: {
         image: images[0],
         prompt: prompt,
       },
     }),
   })
   ```

## Features Implemented

✅ Image upload with preview (minimum 4 images)
✅ Purpose-based configuration mode
✅ Arrangement-based configuration mode
✅ Vastu preference toggle
✅ AI prompt builder utility
✅ Image generation API route
✅ Shuffle layout functionality
✅ Result display with regeneration
✅ Clean, readable code with comments
✅ TypeScript for type safety
✅ Responsive UI styling

## Notes

- This is a prototype, not production-ready code
- Placeholder image generation returns the first uploaded image
- Replace placeholder with actual AI API integration for real generation
- All prompts are constructed dynamically based on user inputs
- No 3D or CAD functionality - pure image-to-image generation approach
