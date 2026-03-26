import { NominatimProvider } from './nominatim'
import type { GeocodingProvider } from './types'

export type { GeocodingProvider, GeocodingResult } from './types'

// Switch provider here when needed (e.g., GoogleMapsProvider)
export function getGeocodingProvider(): GeocodingProvider {
  return new NominatimProvider()
}
