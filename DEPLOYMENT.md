# Deploy on Vercel

This project is configured for one-click deployment on [Vercel](https://vercel.com).

## Quick deploy

1. **Push your code** to GitHub (e.g. [Tatvaops-navya/Room-Configuration](https://github.com/Tatvaops-navya/Room-Configuration)).

2. **Import on Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel will detect Next.js automatically (no extra config needed)

3. **Add environment variables**  
   In your Vercel project: **Settings → Environment Variables**, add:

   | Name | Value | Required |
   |------|--------|----------|
   | `IMAGE_GENERATION_API_KEY` | Your Google Gemini API key | **Yes** |
   | `GEMINI_TEXT_MODEL` | e.g. `gemini-2.5-flash` | No |
   | `GEMINI_IMAGE_MODEL` | e.g. `gemini-3-pro-image-preview` | No |
   | `STABILITY_AI_API_KEY` or `REPLICATE_API_TOKEN` | For real image generation | No (app works with placeholders without these) |

4. **Redeploy** after saving env vars (Deployments → … → Redeploy).

## Notes

- **Function timeouts:** `vercel.json` sets longer timeouts for AI routes (e.g. 60s for `/api/generate`). On the **Hobby** plan the max is 10s; for production use consider the **Pro** plan (up to 60s).
- **Logo:** The download watermark uses `public/tatva-ops-logo.png`. It is included in the repo and will be deployed.
- **Secrets:** Never commit `.env` or `.env.local`. Use only Vercel’s Environment Variables for production.

## Optional: deploy with Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts and add env vars when asked or in the dashboard.
