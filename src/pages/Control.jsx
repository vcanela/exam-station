import { useEffect, useRef, useState } from 'react'
import { useExamState } from '../hooks/useExamState'
import { useNow } from '../hooks/useNow'
import { getDisplayRemainingMs, formatClock, getTimerStatus } from '../lib/store'
import './Control.css'

const FIVE_MIN_MS = 5 * 60 * 1000

const SHORTCUTS = [
  { key: 'Space', action: 'Pause / resume the timer' },
  { key: '+', action: 'Add 5 minutes' },
  { key: '-', action: 'Remove 5 minutes' },
  { key: 'Esc', action: 'Reset timer (asks to confirm)' },
]

function Control() {
  const {
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
  } = useExamState()
  const now = useNow(500)
  const { config, timer, ticker } = state
  const [rulesText, setRulesText] = useState(config.rules.join('\n'))
  const rulesSyncedRef = useRef(config.rules.join('\n'))
  const [draft, setDraft] = useState('')

  // Keep the rules textarea in sync if state changes from elsewhere (e.g. a reload),
  // but don't clobber what the teacher is actively typing.
  useEffect(() => {
    const incoming = config.rules.join('\n')
    if (incoming !== rulesSyncedRef.current) {
      rulesSyncedRef.current = incoming
      setRulesText(incoming)
    }
  }, [config.rules])

  const commitRules = () => {
    const rules = rulesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    rulesSyncedRef.current = rules.join('\n')
    setConfig({ rules })
  }

  const publishDraft = () => {
    if (!draft.trim()) return
    publishAnnouncement(draft)
    setDraft('')
  }

  useEffect(() => {
    function onKeyDown(event) {
      const tag = event.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (event.code === 'Space') {
        event.preventDefault()
        pauseResume()
      } else if (event.key === '+' || event.key === '=') {
        event.preventDefault()
        adjustDuration(FIVE_MIN_MS)
      } else if (event.key === '-') {
        event.preventDefault()
        adjustDuration(-FIVE_MIN_MS)
      } else if (event.key === 'Escape') {
        event.preventDefault()
        if (window.confirm('Reset the timer back to its starting duration?')) {
          reset()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [pauseResume, adjustDuration, reset])

  const status = getTimerStatus(timer)
  const isIdle = status === 'idle'
  const remainingMs = getDisplayRemainingMs(state, now)

  const openStudentView = () => {
    const url = `${window.location.origin}${window.location.pathname}#/student`
    window.open(url, 'examStationStudent')
  }

  return (
    <div className="control">
      <header className="control-topbar">
        <div className="control-title">
          <span className="view-tag">Control view</span>
          <h1>Exam Station</h1>
        </div>
        <button type="button" className="open-student" onClick={openStudentView}>
          Open Student view ↗
        </button>
      </header>

      <section className="panel">
        <h2>Exam setup</h2>
        <div className="field-grid">
          <label>
            Subject
            <input
              type="text"
              value={config.subject}
              onChange={(e) => setConfig({ subject: e.target.value })}
            />
          </label>
          <label>
            Assessment
            <input
              type="text"
              placeholder="e.g. Mid-year exam, Test 3"
              value={config.assessment}
              onChange={(e) => setConfig({ assessment: e.target.value })}
            />
          </label>
          <label className="field-wide">
            Teacher
            <input
              type="text"
              value={config.teacher}
              onChange={(e) => setConfig({ teacher: e.target.value })}
            />
          </label>
        </div>

        <div className="time-setup">
          <span className="field-label">Time limit</span>
          <div className="mode-toggle" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={config.setupMode === 'duration'}
              className={config.setupMode === 'duration' ? 'active' : ''}
              onClick={() => setSetupMode('duration')}
              disabled={!isIdle}
            >
              By duration
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={config.setupMode === 'endTime'}
              className={config.setupMode === 'endTime' ? 'active' : ''}
              onClick={() => setSetupMode('endTime')}
              disabled={!isIdle}
            >
              By end time
            </button>
          </div>

          {config.setupMode === 'duration' ? (
            <div className="duration-picker">
              <button
                type="button"
                className="stepper"
                onClick={() => adjustDurationMinutes(-5)}
                disabled={!isIdle}
                aria-label="Decrease by 5 minutes"
              >
                −5
              </button>
              <button
                type="button"
                className="stepper"
                onClick={() => adjustDurationMinutes(-1)}
                disabled={!isIdle}
                aria-label="Decrease by 1 minute"
              >
                −1
              </button>
              <div className="duration-value">
                <input
                  type="number"
                  min="1"
                  value={config.durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value) || 1)}
                  disabled={!isIdle}
                />
                <span>min</span>
              </div>
              <button
                type="button"
                className="stepper"
                onClick={() => adjustDurationMinutes(1)}
                disabled={!isIdle}
                aria-label="Increase by 1 minute"
              >
                +1
              </button>
              <button
                type="button"
                className="stepper"
                onClick={() => adjustDurationMinutes(5)}
                disabled={!isIdle}
                aria-label="Increase by 5 minutes"
              >
                +5
              </button>
            </div>
          ) : (
            <div className="endtime-picker">
              <label>
                Ends at
                <input
                  type="time"
                  value={config.endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={!isIdle}
                />
              </label>
              <span className="endtime-hint">
                Duration is locked in when you press Start.
              </span>
            </div>
          )}
        </div>

        <label className="rules-field">
          Rules (one per line)
          <textarea
            rows={4}
            value={rulesText}
            onChange={(e) => setRulesText(e.target.value)}
            onBlur={commitRules}
          />
        </label>
      </section>

      <section className="panel">
        <h2>Timer</h2>
        <div className="status-row">
          <span className={`status-pill status-${status}`}>{status}</span>
          <span className="status-time">{formatClock(remainingMs)}</span>
          <span className="status-time-label">remaining</span>
        </div>
        <div className="timer-controls">
          <div className="control-group primary-group">
            {isIdle ? (
              <button type="button" className="btn-start" onClick={start}>
                ▶ Start
              </button>
            ) : (
              <button type="button" className="btn-pause" onClick={pauseResume}>
                {status === 'paused' ? '▶ Resume' : '⏸ Pause'}
              </button>
            )}
          </div>

          <div className="control-group adjust-group" aria-label="Adjust time">
            <span className="group-label">Adjust</span>
            <div className="adjust-buttons">
              <button type="button" className="btn-adjust" onClick={() => adjustDuration(-FIVE_MIN_MS)}>
                −5 min
              </button>
              <button type="button" className="btn-adjust" onClick={() => adjustDuration(FIVE_MIN_MS)}>
                +5 min
              </button>
            </div>
          </div>

          <div className="control-group danger-group">
            <button
              type="button"
              className="btn-reset"
              onClick={() => {
                if (window.confirm('Reset the timer back to its starting duration?')) {
                  reset()
                }
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Announcements</h2>

        <div className="draft-block">
          <span className="field-label draft-label">
            Being edited <span className="tag tag-draft">not shown to students</span>
          </span>
          <div className="draft-row">
            <input
              type="text"
              className="draft-input"
              placeholder="Type an announcement, then Publish…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  publishDraft()
                }
              }}
            />
            <button type="button" className="btn-publish" onClick={publishDraft} disabled={!draft.trim()}>
              Publish
            </button>
          </div>
        </div>

        <div className="live-block">
          <span className="field-label live-label">
            Live on student view <span className="tag tag-live">visible now</span>
          </span>
          {ticker.items.length === 0 ? (
            <p className="empty-live">Nothing published yet.</p>
          ) : (
            <ul className="live-list">
              {ticker.items.map((item, index) => (
                <li key={`${item}-${index}`}>
                  <span>{item}</span>
                  <button
                    type="button"
                    className="remove-announcement"
                    onClick={() => removeAnnouncement(index)}
                    aria-label={`Remove announcement: ${item}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
          {ticker.items.length > 0 && (
            <button type="button" className="btn-clear-all" onClick={clearAnnouncements}>
              Clear all
            </button>
          )}
        </div>
      </section>

      <section className="panel shortcuts-panel">
        <h2>Keyboard shortcuts</h2>
        <p className="hint">Only active on this page, and not while typing in a field.</p>
        <div className="shortcuts-grid">
          {SHORTCUTS.map((s) => (
            <div className="shortcut-row" key={s.key}>
              <kbd>{s.key}</kbd>
              <span>{s.action}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Control
