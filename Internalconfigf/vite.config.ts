import { defineConfig, type Plugin } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

const FIGMA_ASSET_PREFIX = 'figma:asset/'
const FIGMA_VIRTUAL_PREFIX = '\0figma-asset:'

/** Figma Make exports `import x from "figma:asset/<hash>.png"` — Vite cannot resolve that without this plugin. */
function figmaAssetPlugin(): Plugin {
  const publicDir = path.resolve(__dirname, 'public/figma-assets')
  return {
    name: 'figma-asset',
    enforce: 'pre',
    resolveId(id) {
      if (id.startsWith(FIGMA_ASSET_PREFIX)) {
        return FIGMA_VIRTUAL_PREFIX + id.slice(FIGMA_ASSET_PREFIX.length)
      }
      return undefined
    },
    load(id) {
      if (!id.startsWith(FIGMA_VIRTUAL_PREFIX)) return undefined
      const fileName = id.slice(FIGMA_VIRTUAL_PREFIX.length)
      const monorepoFigmaAssets = path.resolve(__dirname, '..', 'public', 'figma-assets')

      const figmaAssetsUrl = (onDiskUnderPublicDir: string) =>
        `/figma-assets/${path.relative(publicDir, onDiskUnderPublicDir).split(path.sep).join('/')}`

      const tryResolveUnder = (baseDir: string): string | undefined => {
        const direct = path.join(baseDir, fileName)
        if (fs.existsSync(direct)) return direct
        const underSrcAssets = path.join(baseDir, 'src', 'assets', fileName)
        if (fs.existsSync(underSrcAssets)) return underSrcAssets
        return undefined
      }

      const local = tryResolveUnder(publicDir)
      if (local) {
        return `export default ${JSON.stringify(figmaAssetsUrl(local))}`
      }

      // Prefer the app-local copy for independent Vercel deploys, but keep the
      // monorepo fallback so local development still works before assets are synced.
      const fromMonorepo = tryResolveUnder(monorepoFigmaAssets)
      if (fromMonorepo) {
        const rel = path.relative(monorepoFigmaAssets, fromMonorepo).split(path.sep).join('/')
        const dest = path.join(publicDir, rel)
        fs.mkdirSync(path.dirname(dest), { recursive: true })
        fs.copyFileSync(fromMonorepo, dest)
        return `export default ${JSON.stringify(figmaAssetsUrl(dest))}`
      }

      // 1×1 transparent PNG — drop real PNGs into public/figma-assets/<same filename> to replace
      const dataUrl =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
      return `export default ${JSON.stringify(dataUrl)}`
    },
  }
}

export default defineConfig({
  server: {
    // Local-only proxy for the companion Next.js backend. Production should use
    // VITE_API_BASE_URL from the frontend runtime instead of same-origin /api.
    proxy: {
      // /api/generate often takes 40–120s; default proxy timeouts drop the response → client never gets imageUrl
      '/api': {
        target: process.env.VITE_NEXT_ORIGIN || 'http://localhost:3000',
        changeOrigin: true,
        timeout: 300_000,
        proxyTimeout: 300_000,
      },
    },
  },
  plugins: [
    figmaAssetPlugin(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
