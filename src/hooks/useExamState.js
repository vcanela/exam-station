import { useCallback, useEffect, useRef, useState } from 'react'
import { STORAGE_KEY, CHANNEL_NAME, loadState, saveState } from '../lib/store'

export function useExamState() {
  const [state, setState] = useState(loadState)
  const channelRef = useRef(null)

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME)
    channelRef.current = channel
    channel.onmessage = (event) => setState(event.data)

    function onStorage(event) {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          setState(JSON.parse(event.newValue))
        } catch {
          // ignore malformed writes from another tab
        }
      }
    }
    window.addEventListener('storage', onStorage)

    return () => {
      channel.close()
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const commit = useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveState(next)
      channelRef.current?.postMessage(next)
      return next
    })
  }, [])

  const setConfig = useCallback(
    (partial) => commit((prev) => ({ ...prev, config: { ...prev.config, ...partial } })),
    [commit],
  )

  const setDurationMinutes = useCallback(
    (minutes) =>
      commit((prev) => ({
        ...prev,
        config: { ...prev.config, durationMinutes: minutes },
        timer:
          prev.timer.startedAt == null
            ? { ...prev.timer, durationMs: minutes * 60 * 1000 }
            : prev.timer,
      })),
    [commit],
  )

  const setTicker = useCallback(
    (text) => commit((prev) => ({ ...prev, ticker: { text } })),
    [commit],
  )

  const start = useCallback(
    () =>
      commit((prev) => ({
        ...prev,
        timer: { ...prev.timer, startedAt: Date.now(), pausedAt: null, totalPausedMs: 0 },
      })),
    [commit],
  )

  const pauseResume = useCallback(
    () =>
      commit((prev) => {
        const { timer } = prev
        if (timer.startedAt == null) return prev
        if (timer.pausedAt != null) {
          const pausedDuration = Date.now() - timer.pausedAt
          return {
            ...prev,
            timer: {
              ...timer,
              pausedAt: null,
              totalPausedMs: timer.totalPausedMs + pausedDuration,
            },
          }
        }
        return { ...prev, timer: { ...timer, pausedAt: Date.now() } }
      }),
    [commit],
  )

  const adjustDuration = useCallback(
    (deltaMs) =>
      commit((prev) => ({
        ...prev,
        timer: { ...prev.timer, durationMs: Math.max(0, prev.timer.durationMs + deltaMs) },
      })),
    [commit],
  )

  const reset = useCallback(
    () =>
      commit((prev) => ({
        ...prev,
        timer: {
          durationMs: prev.config.durationMinutes * 60 * 1000,
          startedAt: null,
          pausedAt: null,
          totalPausedMs: 0,
        },
      })),
    [commit],
  )

  return {
    state,
    setConfig,
    setDurationMinutes,
    setTicker,
    start,
    pauseResume,
    adjustDuration,
    reset,
  }
}
