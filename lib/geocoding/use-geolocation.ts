import { useCallback, useRef, useState } from 'react'
import { getGeocodingProvider } from './index'
import type { GeocodingResult } from './types'

export function useGeolocation() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GeocodingResult | null>(null)
  const providerRef = useRef(getGeocodingProvider())

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setIsLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const geocoded = await providerRef.current.reverseGeocode(
            position.coords.latitude,
            position.coords.longitude,
          )
          setResult(geocoded)
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to determine address from coordinates',
          )
        } finally {
          setIsLoading(false)
        }
      },
      (positionError) => {
        setIsLoading(false)
        switch (positionError.code) {
          case positionError.PERMISSION_DENIED:
            setError('Location permission denied. Please allow location access in your browser settings.')
            break
          case positionError.POSITION_UNAVAILABLE:
            setError('Location information is unavailable. Please try again later.')
            break
          case positionError.TIMEOUT:
            setError('Location request timed out. Please try again.')
            break
          default:
            setError('An unknown error occurred while getting your location.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      },
    )
  }, [])

  return { getLocation, isLoading, error, result }
}
