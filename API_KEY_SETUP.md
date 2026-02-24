# API Key Setup

Your Google Gemini API key has been configured in the code. To use it, you need to create a `.env.local` file in the root directory.

## Required: Gemini API Key

The `.env.local` file should contain at minimum:

```
IMAGE_GENERATION_API_KEY=AIzaSyA4V8ily2RqvNc4IxhzdjhzlQIHp0Dd9pw
```

## Optional: Image Generation API Keys

For **actual image generation** (modifying room images based on your inputs), you need one of these:

### Option 1: Stability AI (Recommended)

1. Go to https://platform.stability.ai/
2. Sign up for an account
3. Navigate to API Keys section
4. Create a new API key
5. Add to `.env.local`:

```
STABILITY_AI_API_KEY=your_stability_ai_key_here
```

**Pricing:** Free tier available, then pay-as-you-go

### Option 2: Replicate

1. Go to https://replicate.com/
2. Sign up for an account
3. Go to Account Settings → API Tokens
4. Create a new token
5. Add to `.env.local`:

```
REPLICATE_API_TOKEN=your_replicate_token_here
```

**Pricing:** Pay-per-use, typically $0.002-0.01 per image

## Complete .env.local Example

```
# Required: Google Gemini API Key (for prompt enhancement)
IMAGE_GENERATION_API_KEY=AIzaSyA4V8ily2RqvNc4IxhzdjhzlQIHp0Dd9pw

# Optional: Stability AI API Key (for actual image generation)
STABILITY_AI_API_KEY=your_stability_ai_key_here

# Optional: Replicate API Token (alternative image generation service)
REPLICATE_API_TOKEN=your_replicate_token_here
```

## How It Works

1. **Gemini API** (Required): Analyzes your room images and enhances the prompt with specific configuration details
2. **Stability AI or Replicate** (Optional): Takes the enhanced prompt and original image, generates a modified room image based on your configuration inputs

## Steps:

1. Create a file named `.env.local` in the root directory (same level as `package.json`)
2. Add your API keys as shown above
3. Restart your development server if it's running: `npm run dev`

## Important Notes:

- The `.env.local` file is gitignored and won't be committed to version control
- **Without Stability AI or Replicate API key:** The system will use Gemini to analyze images and log the enhanced descriptions, but will return the original image (demonstrating the flow)
- **With Stability AI or Replicate API key:** The system will generate actual modified room images based on your configuration inputs
- The system tries Stability AI first, then Replicate, then falls back to placeholder if neither is configured
