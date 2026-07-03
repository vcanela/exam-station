import { useEffect, useMemo, useRef, useState } from 'react'
import { useExamState } from '../hooks/useExamState'
import { useNow } from '../hooks/useNow'
import { getDisplayRemainingMs, formatClock } from '../lib/store'
import './Student.css'

const WARNING_MS = 15 * 60 * 1000
const CRITICAL_MS = 5 * 60 * 1000

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const now = ctx.currentTime
    ;[0, 0.35, 0.7].forEach((offset) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.0001, now + offset)
      gain.gain.exponentialRampToValueAtTime(0.3, now + offset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.3)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + offset)
      osc.stop(now + offset + 0.32)
    })
  } catch {
    // Web Audio unavailable — visual state change still communicates time's up.
  }
}

function Student() {
  const { state } = useExamState()
  const now = useNow(250)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const hasChimedRef = useRef(false)

  const { config, timer, ticker } = state
  const remainingMs = getDisplayRemainingMs(state, now)
  const isStarted = timer.startedAt != null
  const isTimeUp = isStarted && remainingMs <= 0
  const progress = timer.durationMs > 0 ? 1 - remainingMs / timer.durationMs : 0
  const announcementLines = ticker.items

  const urgency = useMemo(() => {
    if (!isStarted) return 'idle'
    if (remainingMs <= 0) return 'done'
    if (remainingMs <= CRITICAL_MS) return 'critical'
    if (remainingMs <= WARNING_MS) return 'warning'
    return 'normal'
  }, [isStarted, remainingMs])

  useEffect(() => {
    if (isTimeUp && !hasChimedRef.current) {
      hasChimedRef.current = true
      playChime()
    }
    if (!isTimeUp) {
      hasChimedRef.current = false
    }
  }, [isTimeUp])

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const enterFullscreen = () => {
    document.documentElement.requestFullscreen?.().catch(() => {})
  }

  const currentTime = new Date(now).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className={`student urgency-${urgency}`}>
      <div className="top-bar">
        <span className="view-label">Student view</span>
        <header className="student-header">
          <div className="header-item">
            <span className="header-label">Subject</span>
            <span className="header-value">{config.subject || '—'}</span>
          </div>
          <div className="header-item">
            <span className="header-label">Assessment</span>
            <span className="header-value">{config.assessment || '—'}</span>
          </div>
          <div className="header-item">
            <span className="header-label">Teacher</span>
            <span className="header-value">{config.teacher || '—'}</span>
          </div>
        </header>
        {!isFullscreen ? (
          <button type="button" className="fullscreen-btn" onClick={enterFullscreen}>
            Enter fullscreen
          </button>
        ) : (
          <span className="top-bar-spacer" />
        )}
      </div>

      <main className="student-main">
        {isTimeUp ? (
          <div className="time-up">TIME HAS EXPIRED</div>
        ) : (
          <>
            <div className="countdown">{formatClock(remainingMs)}</div>
            <div className="countdown-label">
              {isStarted ? 'remaining' : 'not started'}
            </div>
          </>
        )}
        <div className="current-time">
          <span className="current-time-label">Current time</span>
          <span className="current-time-value">{currentTime}</span>
        </div>
      </main>

      <div className="student-lower">
        {announcementLines.length > 0 && (
          <ul className="announcements">
            {announcementLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
        {config.rules.length > 0 && (
          <ul className="rules">
            {config.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
        />
      </div>
    </div>
  )
}

export default Student
