import { useEffect, useRef, useState } from 'react'
import { useExamState } from '../hooks/useExamState'
import { useNow } from '../hooks/useNow'
import { computeRemainingMs, formatClock, getTimerStatus } from '../lib/store'
import './Control.css'

const FIVE_MIN_MS = 5 * 60 * 1000

const SHORTCUTS = [
  { key: 'Space', action: 'Pause / resume the timer' },
  { key: '+', action: 'Add 5 minutes' },
  { key: '-', action: 'Remove 5 minutes' },
  { key: 'Esc', action: 'Reset timer (asks to confirm)' },
]

function Control() {
  const { state, setConfig, setDurationMinutes, setTicker, start, pauseResume, adjustDuration, reset } =
    useExamState()
  const now = useNow(500)
  const { config, timer, ticker } = state
  const [rulesText, setRulesText] = useState(config.rules.join('\n'))
  const rulesSyncedRef = useRef(config.rules.join('\n'))

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
  const remainingMs = computeRemainingMs(timer, now)

  const openStudentView = () => {
    const url = `${window.location.origin}${window.location.pathname}#/student`
    window.open(url, 'examStationStudent')
  }

  return (
    <div className="control">
      <h1>Control view</h1>

      <button type="button" className="open-student" onClick={openStudentView}>
        Open Student view
      </button>

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
          <label>
            Teacher
            <input
              type="text"
              value={config.teacher}
              onChange={(e) => setConfig({ teacher: e.target.value })}
            />
          </label>
          <label>
            Duration (minutes)
            <input
              type="number"
              min="1"
              value={config.durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value) || 0)}
              disabled={status !== 'idle'}
            />
          </label>
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
          <span className="status-time">{formatClock(remainingMs)} remaining</span>
        </div>
        <div className="button-row">
          {status === 'idle' && (
            <button type="button" className="btn-start" onClick={start}>
              Start
            </button>
          )}
          {status !== 'idle' && (
            <button type="button" className="btn-pause" onClick={pauseResume}>
              {status === 'paused' ? 'Resume' : 'Pause'}
            </button>
          )}
          <button type="button" className="btn-plus" onClick={() => adjustDuration(FIVE_MIN_MS)}>
            +5 min
          </button>
          <button type="button" className="btn-minus" onClick={() => adjustDuration(-FIVE_MIN_MS)}>
            −5 min
          </button>
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
      </section>

      <section className="panel">
        <h2>Announcements</h2>
        <p className="hint">
          One announcement per line — each shows on its own line on the Student view.
          e.g. "Q4 should say 'Solve for Y', not 'X'" on one line, "Q9 diagram is missing a label" on the next.
        </p>
        <textarea
          rows={3}
          className="ticker-input"
          placeholder="Q4 should say 'Solve for Y', not 'X'"
          value={ticker.text}
          onChange={(e) => setTicker(e.target.value)}
        />
        {ticker.text && (
          <button type="button" onClick={() => setTicker('')}>
            Clear all announcements
          </button>
        )}
      </section>
    </div>
  )
}

export default Control
