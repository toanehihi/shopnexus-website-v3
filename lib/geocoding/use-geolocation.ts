import { useCallback, useState } from 'react'
import { customFetchStandard } from '@/lib/queryclient/custom-fetch'

export type GeocodingResult = {
  address: string
  latitude: number
  longitude: number
}

// useGeolocation gets browser GPS position and reverse geocodes via the backend.
export function useGeolocation() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GeocodingResult | null>(null)

  const getLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      // Step 1: Get GPS coordinates from browser
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, (err) => {
          const messages: Record<number, string> = {
            1: 'Location permission denied. Please allow location access in your browser settings.',
            2: 'Location unavailable. Please check your device GPS settings.',
            3: 'Location request timed out. Please try again.',
          }
          reject(new Error(messages[err.code] || `Geolocation error (code ${err.code}): ${err.message}`))
        }, { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 })
      })

      // Step 2: Reverse geocode via backend
      const geocoded = await customFetchStandard<GeocodingResult>('common/geocode/reverse', {
        method: 'POST',
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      })

      setResult(geocoded)
      return geocoded
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get location'
      setError(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { getLocation, isLoading, error, result }
}
