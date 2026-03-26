import { useCallback, useState } from 'react'
import { customFetchStandard } from '@/lib/queryclient/custom-fetch'

export type GeocodingResult = {
  address: string
  latitude: number
  longitude: number
  accuracy: number // meters — lower is better
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
      // Step 1: Get GPS coordinates — try high accuracy first, fall back to low
      const position = await getGPSPosition()

      const { latitude, longitude, accuracy } = position.coords

      // Step 2: Reverse geocode via backend
      const geocoded = await customFetchStandard<Omit<GeocodingResult, 'accuracy'>>('common/geocode/reverse', {
        method: 'POST',
        body: JSON.stringify({ latitude, longitude }),
      })

      const fullResult: GeocodingResult = { ...geocoded, accuracy }
      setResult(fullResult)
      return fullResult
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

// Format accuracy into a human-readable string.
export function formatAccuracy(meters: number): { label: string; level: 'good' | 'ok' | 'poor' } {
  if (meters <= 20) return { label: `±${Math.round(meters)}m (precise)`, level: 'good' }
  if (meters <= 100) return { label: `±${Math.round(meters)}m`, level: 'ok' }
  if (meters <= 1000) return { label: `±${(meters / 1000).toFixed(1)}km (approximate)`, level: 'poor' }
  return { label: `±${Math.round(meters / 1000)}km (very approximate — please verify address)`, level: 'poor' }
}

// Try high accuracy GPS first (mobile), fall back to low accuracy (desktop WiFi/IP).
function getGPSPosition(): Promise<GeolocationPosition> {
  const errorMessages: Record<number, string> = {
    1: 'Location blocked. Click the lock icon in your address bar → Site settings → Location → Allow, then try again.',
    2: 'Location unavailable. Please check your device GPS settings.',
    3: 'Location request timed out. Please try again.',
  }

  function attempt(highAccuracy: boolean, timeout: number): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, (err) => {
        reject(err)
      }, { enableHighAccuracy: highAccuracy, timeout, maximumAge: 300000 })
    })
  }

  // Try high accuracy (GPS) with 8s timeout, then fall back to low accuracy
  return attempt(true, 8000).catch(() => attempt(false, 15000)).catch((err) => {
    throw new Error(errorMessages[err.code] || `Geolocation error (code ${err.code}): ${err.message}`)
  })
}
