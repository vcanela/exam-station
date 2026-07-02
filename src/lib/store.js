export const STORAGE_KEY = 'examStation:v1'
export const CHANNEL_NAME = 'exam-station'

export function defaultState() {
  return {
    config: {
      subject: '',
      assessment: '',
      teacher: '',
      durationMinutes: 45,
      rules: ['Phones away', 'Black/blue ink only', 'Do not turn the page yet'],
    },
    timer: {
      durationMs: 45 * 60 * 1000,
      startedAt: null,
      pausedAt: null,
      totalPausedMs: 0,
    },
    ticker: {
      text: '',
    },
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw)
    const base = defaultState()
    return {
      config: { ...base.config, ...parsed.config },
      timer: { ...base.timer, ...parsed.timer },
      ticker: { ...base.ticker, ...parsed.ticker },
    }
  } catch {
    return defaultState()
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

// Remaining time is always derived from wall-clock timestamps, never from a
// running counter, so it survives reloads, sleeps, and cross-tab sync cleanly.
export function computeRemainingMs(timer, now) {
  const { durationMs, startedAt, pausedAt, totalPausedMs } = timer
  if (startedAt == null) return durationMs
  const elapsedEnd = pausedAt ?? now
  const elapsed = elapsedEnd - startedAt - totalPausedMs
  return Math.max(0, durationMs - elapsed)
}

export function getTimerStatus(timer) {
  if (timer.startedAt == null) return 'idle'
  if (timer.pausedAt != null) return 'paused'
  return 'running'
}

export function formatClock(ms) {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
