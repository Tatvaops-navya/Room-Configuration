/**
 * Image model API integration for preset application.
 * When user selects a preset, we can send the cutout + material description to an
 * image model (e.g. Replicate) to transform the component in the uploaded image.
 *
 * Configure via env: VITE_IMAGE_API_KEY, VITE_IMAGE_MODEL
 */

import type { ProductVariation } from '../types'
import { COMPONENT_TYPE_LABELS } from '../data/productVariations'

const API_BASE = import.meta.env.VITE_IMAGE_API_URL ?? 'https://api.replicate.com/v1'
const API_KEY = import.meta.env.VITE_IMAGE_API_KEY ?? ''
const MODEL = import.meta.env.VITE_IMAGE_MODEL ?? ''

export function isImageModelConfigured(): boolean {
  return Boolean(API_KEY && MODEL)
}

/** Build a short prompt for the image model from the selected preset (color, material, texture, finish). */
export function buildPresetPrompt(variation: ProductVariation): string {
  const typeLabel = COMPONENT_TYPE_LABELS[variation.componentType]
  return `Transform this ${typeLabel.toLowerCase()} to look like: ${variation.color}, ${variation.material}, ${variation.texture} texture, ${variation.finish} finish. Keep the same object shape and pose, only change the material, color and surface appearance.`
}

/**
 * Transform the component image using the configured image model.
 * Sends image + preset prompt to the API and returns the result as a data URL.
 * Throws on missing config or API errors.
 */
export async function transformComponentWithPreset(
  imageDataUrl: string,
  variation: ProductVariation
): Promise<string> {
  if (!API_KEY || !MODEL) {
    throw new Error('Image model not configured. Set VITE_IMAGE_API_KEY and VITE_IMAGE_MODEL in .env')
  }

  const prompt = buildPresetPrompt(variation)

  // Replicate-style: POST /predictions with Prefer: wait
  const createUrl = `${API_BASE.replace(/\/$/, '')}/predictions`
  const res = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'wait=60',
    },
    body: JSON.stringify({
      version: MODEL,
      input: {
        image: imageDataUrl,
        prompt,
        // Some models use different param names; add if your model needs them:
        // prompt_strength: 0.8,
        // num_outputs: 1,
      },
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Image model API error (${res.status}): ${errText}`)
  }

  const data = (await res.json()) as {
    status?: string
    output?: string | string[]
    error?: string
    urls?: { get?: string }
  }

  if (data.error) {
    throw new Error(data.error)
  }

  // Output can be URL string or array of URLs
  const outputUrl = Array.isArray(data.output) ? data.output[0] : data.output
  if (!outputUrl || typeof outputUrl !== 'string') {
    // If sync didn't complete, prediction may be in "starting" state; poll if we have urls.get
    if (data.urls?.get) {
      const result = await pollPredictionUntilComplete(data.urls.get)
      return result
    }
    throw new Error('No image output from model')
  }

  return urlToDataUrl(outputUrl)
}

async function pollPredictionUntilComplete(getUrl: string): Promise<string> {
  const maxAttempts = 30
  const delayMs = 2000

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, delayMs))
    const res = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    })
    if (!res.ok) throw new Error(`Poll failed: ${res.status}`)
    const data = (await res.json()) as {
      status: string
      output?: string | string[]
      error?: string
    }
    if (data.error) throw new Error(data.error)
    if (data.status === 'succeeded' && data.output) {
      const outputUrl = Array.isArray(data.output) ? data.output[0] : data.output
      if (typeof outputUrl === 'string') return urlToDataUrl(outputUrl)
    }
    if (data.status === 'failed' || data.status === 'canceled') {
      throw new Error(`Prediction ${data.status}`)
    }
  }

  throw new Error('Image model timed out')
}

async function urlToDataUrl(imageUrl: string): Promise<string> {
  const res = await fetch(imageUrl, { mode: 'cors' })
  if (!res.ok) throw new Error(`Failed to fetch result image: ${res.status}`)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
