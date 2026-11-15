# CareCall V14 — Multi-Display Simultaneous Audio & Calling

CareCall V14 introduces true multi-display support, simultaneous audio announcements across multiple TVs/browsers, and dynamic WebSocket role resolution.

---

## Quick URLs

| Screen | URL | Purpose |
| :--- | :--- | :--- |
| **Doctor Console** | `http://localhost:3000/v14/doctor` | Keypad & Display Preview to trigger queue calls |
| **Display Screen** | `http://localhost:3000/v14/display` | Full-screen queue number display with bilingual voice announcements |

---

## Key Features in V14

### 1. Simultaneous Multi-Display Broadcasting
- **Multiple TV & Browser Support**: Any number of display screens (e.g. waiting room TV, hallway screen, reception desk tablet) can stay connected at the same time.
- **No Disconnect Collisions**: Removed the legacy close code `4001` that previously disconnected earlier screens when a new display joined.
- **Synchronized State**: When a doctor enters a number and presses **Send to display**, every connected screen updates instantaneously.

### 2. Bilingual Voice Announcements
- **English**: Uses the browser's native Web Speech API (`SpeechSynthesisUtterance`) with natural cadence.
- **Telugu**: Plays high-clarity local WAV audio clips for numbers `1` through `10` (`/v14/display/audio/te/01.wav`–`10.wav`).
- **Autoplay Resilience**: Complies with modern browser autoplay policies. A single click or tap anywhere on the display window unlocks audio output.

### 3. Dynamic WebSocket Routing
- Clients connect to `ws://<host>:<port>/ws?role=doctor-v14` or `ws://<host>:<port>/ws?role=display-v14`.
- The server matches versioned roles dynamically via `^(doctor|display)-(v\d+)$` and routes them to a unified shared state.
- Keep-alive heartbeat pings every 25 seconds prevent router/TV sleep disconnections.

---

## Operating Instructions for Displays

1. Open `http://localhost:3000/v14/display` on each target TV or monitor.
2. Tap or click once anywhere on the screen (or click **Test voice**) to activate audio in that browser window.
3. Keep the toggle set to **Voice on** with your preferred language (**English** or **Telugu**).
4. Calls sent from `/v14/doctor` will now play aloud on all connected screens in real-time.
