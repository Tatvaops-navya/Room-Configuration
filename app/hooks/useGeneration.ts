'use client'

const DEFAULT_TIMEOUT_MS = 240_000
const DEFAULT_MAX_RETRIES = 2

/**
 * POST JSON with timeout and limited retries on network / 5xx failures.
 * Does not change API contracts; improves resilience for long-running /api/generate calls.
 */
export async function postJsonWithRetry(
  url: string,
  body: unknown,
  options?: { timeoutMs?: number; maxRetries?: number }
): Promise<Response> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES
  let lastErr: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController()
    const tid = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      clearTimeout(tid)
      if (!res.ok && res.status >= 500 && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 2000))
        continue
      }
      return res
    } catch (e) {
      clearTimeout(tid)
      lastErr = e
      const retryable =
        attempt < maxRetries &&
        e instanceof Error &&
        (e.name === 'AbortError' || e.message.includes('fetch') || e.message.includes('Failed to fetch'))
      if (retryable) {
        await new Promise((r) => setTimeout(r, 2000))
        continue
      }
      throw e
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Request failed after retries')
}
