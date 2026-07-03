export const STORAGE_KEY = 'examStation:v1'
export const CHANNEL_NAME = 'exam-station'

export function defaultState() {
  return {
    config: {
      subject: '',
      assessment: '',
      teacher: '',
      setupMode: 'duration', // 'duration' | 'endTime'
      durationMinutes: 45,
      endTime: '', // "HH:MM" (24h)
      rules: ['Phones away', 'Black/blue ink only', 'Do not turn the page yet'],
    },
    timer: {
      durationMs: 45 * 60 * 1000,
      startedAt: null,
      pausedAt: null,
      totalPausedMs: 0,
    },
    ticker: {
      items: [], // published announcements (strings); these are what students see
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
      // Normalize the ticker to the items[] shape (older builds stored a `text` string).
      ticker: {
        items: Array.isArray(parsed.ticker?.items) ? parsed.ticker.items : [],
      },
    }
  } catch {
    return defaultState()
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

// Convert an "HH:MM" clock time into a timestamp on the same day as `now`.
export function endTimeToMs(hhmm, now) {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return null
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date(now)
  d.setHours(h, m, 0, 0)
  return d.getTime()
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

// What the Student view should show. Once started, it's the running timer.
// While idle, it previews the configured limit (a live countdown to the end
// time in end-time mode, or the fixed duration in duration mode).
export function getDisplayRemainingMs(state, now) {
  const { timer, config } = state
  if (timer.startedAt != null) return computeRemainingMs(timer, now)
  if (config.setupMode === 'endTime') {
    const endMs = endTimeToMs(config.endTime, now)
    if (endMs == null) return 0
    return Math.max(0, endMs - now)
  }
  return timer.durationMs
}

// The duration to lock in when the timer starts, based on the setup mode.
export function resolveStartDurationMs(config, now) {
  if (config.setupMode === 'endTime') {
    const endMs = endTimeToMs(config.endTime, now)
    if (endMs == null) return 0
    return Math.max(0, endMs - now)
  }
  return config.durationMinutes * 60 * 1000
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
