/**
 * Renders PROJECT_OVERVIEW.md → PROJECT_OVERVIEW.html → PROJECT_OVERVIEW.pdf
 * Uses `marked` (install: npm install marked --no-save) and Microsoft Edge headless.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { marked } from 'marked'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const mdPath = resolve(root, 'PROJECT_OVERVIEW.md')
const htmlPath = resolve(root, 'PROJECT_OVERVIEW.html')
const pdfPath = resolve(root, 'PROJECT_OVERVIEW.pdf')

const md = readFileSync(mdPath, 'utf8')
const css = `
  body { font-family: "Segoe UI", system-ui, sans-serif; line-height: 1.45; padding: 36px; max-width: 900px; margin: 0 auto; color: #111; font-size: 11pt; }
  h1 { font-size: 1.75rem; }
  h2 { font-size: 1.3rem; margin-top: 1.4rem; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  h3 { font-size: 1.05rem; margin-top: 1rem; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 9.5pt; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f0f0f0; }
  code { background: #f5f5f5; padding: 1px 5px; border-radius: 3px; font-size: 0.9em; font-family: Consolas, monospace; }
  pre { background: #f8f8f8; padding: 10px; overflow: auto; font-size: 9pt; }
  hr { border: none; border-top: 1px solid #ddd; margin: 22px 0; }
  a { color: #1565c0; }
`
const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>AI Room Configuration — Project Overview</title><style>${css}</style></head><body>${marked.parse(md)}</body></html>`
writeFileSync(htmlPath, html, 'utf8')

function findEdge() {
  const candidates = [
    process.env.PROGRAMFILES && `${process.env.PROGRAMFILES}\\Microsoft\\Edge\\Application\\msedge.exe`,
    process.env['PROGRAMFILES(X86)'] && `${process.env['PROGRAMFILES(X86)']}\\Microsoft\\Edge\\Application\\msedge.exe`,
  ].filter(Boolean)
  for (const p of candidates) {
    if (p && existsSync(p)) return p
  }
  return null
}

const edge = findEdge()
if (!edge) {
  console.error('Microsoft Edge not found. Open PROJECT_OVERVIEW.html in a browser and use Print → Save as PDF.')
  process.exit(1)
}

const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/')
const r = spawnSync(
  edge,
  ['--headless=new', '--disable-gpu', `--print-to-pdf=${pdfPath}`, fileUrl],
  { stdio: 'inherit' }
)
if (r.status !== 0) {
  console.error('Edge print-to-pdf failed. Open PROJECT_OVERVIEW.html and print to PDF manually.')
  process.exit(r.status ?? 1)
}
if (!existsSync(pdfPath)) {
  console.error('PDF was not created. Open PROJECT_OVERVIEW.html and print to PDF manually.')
  process.exit(1)
}
console.log('Wrote', pdfPath)
