export interface GeocodingResult {
  address: string
  latitude: number
  longitude: number
}

export interface GeocodingProvider {
  reverseGeocode(lat: number, lng: number): Promise<GeocodingResult>
}
