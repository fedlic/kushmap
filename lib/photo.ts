const PHOTO_API_BASE = 'https://kushmap.vercel.app/api/photo'

export function photoProxyUrl(url: string): string {
  return `${PHOTO_API_BASE}?url=${encodeURIComponent(url)}`
}
