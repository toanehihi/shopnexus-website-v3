import type { GeocodingProvider, GeocodingResult } from './types'

export class NominatimProvider implements GeocodingProvider {
  private lastRequestTime = 0

  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
    // Respect Nominatim's 1 req/sec rate limit
    const now = Date.now()
    const elapsed = now - this.lastRequestTime
    if (elapsed < 1000) {
      await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed))
    }

    this.lastRequestTime = Date.now()

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ShopNexus/1.0 (https://shopnexus.com)',
      },
    })

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(`Geocoding failed: ${data.error}`)
    }

    return {
      address: data.display_name,
      latitude: lat,
      longitude: lng,
    }
  }
}
