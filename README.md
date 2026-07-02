# Exam Station

A projector-friendly countdown timer and announcement display for exams. Two synced windows: a **Control** panel for the teacher's laptop, and a full-screen **Display** for the projector.

## Running locally

```
npm install
npm run dev
```

Open the printed local URL, then:

- `#/control` — the teacher's panel (keep this on your laptop, not projected)
- `#/display` — the projector view (open full-screen)

They stay in sync automatically via `localStorage` + `BroadcastChannel`, and state survives page reloads.

## Keyboard shortcuts (on the Control page, when not typing in a field)

- `Space` — pause/resume the timer
- `+` / `-` — add or remove 5 minutes
- `Esc` — reset the timer (with confirmation)

## Building

```
npm run build
```

Outputs a static site to `dist/`, including a service worker so the app works offline once loaded (installable as a PWA).
