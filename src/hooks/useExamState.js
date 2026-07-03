import { useCallback, useEffect, useRef, useState } from 'react'
import { STORAGE_KEY, CHANNEL_NAME, loadState, saveState, resolveStartDurationMs } from '../lib/store'

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

  const setSetupMode = useCallback(
    (mode) => commit((prev) => ({ ...prev, config: { ...prev.config, setupMode: mode } })),
    [commit],
  )

  const setDurationMinutes = useCallback(
    (minutes) => {
      const clamped = Math.max(1, Math.round(minutes) || 0)
      commit((prev) => ({
        ...prev,
        config: { ...prev.config, durationMinutes: clamped },
        timer:
          prev.timer.startedAt == null
            ? { ...prev.timer, durationMs: clamped * 60 * 1000 }
            : prev.timer,
      }))
    },
    [commit],
  )

  const adjustDurationMinutes = useCallback(
    (delta) =>
      commit((prev) => {
        const next = Math.max(1, prev.config.durationMinutes + delta)
        return {
          ...prev,
          config: { ...prev.config, durationMinutes: next },
          timer:
            prev.timer.startedAt == null
              ? { ...prev.timer, durationMs: next * 60 * 1000 }
              : prev.timer,
        }
      }),
    [commit],
  )

  const setEndTime = useCallback(
    (endTime) => commit((prev) => ({ ...prev, config: { ...prev.config, endTime } })),
    [commit],
  )

  const publishAnnouncement = useCallback(
    (text) => {
      const trimmed = text.trim()
      if (!trimmed) return
      commit((prev) => ({ ...prev, ticker: { items: [...prev.ticker.items, trimmed] } }))
    },
    [commit],
  )

  const removeAnnouncement = useCallback(
    (index) =>
      commit((prev) => ({
        ...prev,
        ticker: { items: prev.ticker.items.filter((_, i) => i !== index) },
      })),
    [commit],
  )

  const clearAnnouncements = useCallback(
    () => commit((prev) => ({ ...prev, ticker: { items: [] } })),
    [commit],
  )

  const start = useCallback(
    () =>
      commit((prev) => ({
        ...prev,
        timer: {
          durationMs: resolveStartDurationMs(prev.config, Date.now()),
          startedAt: Date.now(),
          pausedAt: null,
          totalPausedMs: 0,
        },
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
          durationMs: resolveStartDurationMs(prev.config, Date.now()),
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
    setSetupMode,
    setDurationMinutes,
    adjustDurationMinutes,
    setEndTime,
    publishAnnouncement,
    removeAnnouncement,
    clearAnnouncements,
    start,
    pauseResume,
    adjustDuration,
    reset,
  }
}
