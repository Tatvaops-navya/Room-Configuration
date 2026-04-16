const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL

function normalizeBaseUrl(value: string | undefined): string {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed
}

export const API_BASE_URL = normalizeBaseUrl(rawApiBaseUrl)

export function buildApiUrl(path: string): string {
  if (!path.startsWith('/')) {
    throw new Error(`API path must start with "/": ${path}`)
  }
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path
}

export function getApiBaseUrlHelpText(): string {
  if (API_BASE_URL) {
    return `configured backend ${API_BASE_URL}`
  }
  return 'same-origin backend or VITE_API_BASE_URL'
}
