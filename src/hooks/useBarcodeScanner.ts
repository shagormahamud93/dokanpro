import { useEffect, useRef } from 'react'

interface Options {
  /** Max ms between consecutive keys to be considered scanner input */
  maxInterval?: number
  /** Minimum length of a valid barcode */
  minLength?: number
  /** Called with the scanned code */
  onScan: (code: string) => void
  enabled?: boolean
}

/**
 * Detects hardware barcode scanners that emit a fast burst of keystrokes
 * followed by Enter. Falls through normal keyboard events when the burst
 * is too slow (i.e. a human typing).
 */
export function useBarcodeScanner({
  maxInterval = 35,
  minLength = 6,
  onScan,
  enabled = true,
}: Options) {
  const bufferRef = useRef('')
  const lastKeyAtRef = useRef(0)
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan

  useEffect(() => {
    if (!enabled) return

    const reset = () => {
      bufferRef.current = ''
      lastKeyAtRef.current = 0
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const now = performance.now()
      const interval = now - lastKeyAtRef.current

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= minLength) {
          onScanRef.current(bufferRef.current)
          e.preventDefault()
          e.stopPropagation()
        }
        reset()
        return
      }

      // Only printable single-char keys count
      if (e.key.length !== 1) {
        reset()
        return
      }

      // Slow → human typing → reset buffer
      if (lastKeyAtRef.current && interval > maxInterval) {
        bufferRef.current = ''
      }

      bufferRef.current += e.key
      lastKeyAtRef.current = now
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [enabled, maxInterval, minLength])
}
