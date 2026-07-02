# Exam Station

A projector-friendly countdown timer and announcement display for exams. Two synced windows: the **Control view** for the teacher's laptop, and the **Student view**, full-screen on the projector.

## Running locally

```
npm install
npm run dev
```

Open the printed local URL — it opens straight into the Control view. Set up the exam, then click "Open Student view" to open the projector window (move that window to the projector and enter fullscreen).

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
