import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Simple resend countdown used by the OTP screens.
 * `start()` resets the countdown back to the initial seconds.
 */
export function useCountdown(initialSeconds: number) {
  const [remaining, setRemaining] = useState(initialSeconds)
  const [running, setRunning] = useState(true)
  const intervalRef = useRef<number | null>(null)

  const stop = useCallback(() => {
    setRunning(false)
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    setRemaining(initialSeconds)
    setRunning(true)
  }, [initialSeconds])

  useEffect(() => {
    if (!running) return
    intervalRef.current = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          if (intervalRef.current !== null) {
            window.clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          setRunning(false)
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [running])

  return { remaining, isRunning: running, start, stop }
}
