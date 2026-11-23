# ✚ CareCall — Smart Clinic Queue Notifier

> **Single-channel, multi-screen, real-time appointment calling system for clinics, hospitals, and service desks.**

CareCall is a lightweight, self-hosted queue-call notifier. Doctors or staff dial a token number on any device — a large desktop console, a mobile phone, or a tablet — and every waiting-area display screen instantly shows and announces that number with bilingual (Telugu + English) voice.

---

## 🖥️ What You Get

| Screen | URL | Who Uses It |
|---|---|---|
| 🏠 **Home / Gateway** | `/` | Opens the launcher — pick your screen |
| 📺 **Waiting Display** | `/display/` | TV or monitor in the waiting room |
| 🩺 **Doctor Console** | `/dr/` | Doctor's workstation — full desktop keypad |
| 📱 **Doctor Mobile** | `/mobile/` | Doctor's phone or tablet — compact keypad |
| 📱 Doctor Mobile V-1 | `/mobile/v1/` | Original mobile keypad |
| 📱 Doctor Mobile V-2 | `/mobile/v2/` | Compact keypad (no top header band) |
| 📱 Doctor Mobile V-3 | `/mobile/v3/` | Status + live token card in one row (latest) |

All screens connect over a **single WebSocket channel** (`/ws`). No database, no login, no backend framework — just Node.js, the `ws` library, and plain HTML/CSS/JS.

---

## ⚡ Quick Start

**Requires Node.js ≥ 20.6**

```powershell
# 1. Install
npm install

# 2. Run
npm start
# → CareCall listening on http://0.0.0.0:3001
```

Open your browser and navigate to **[http://localhost:3001/](http://localhost:3001/)** to reach the Home gateway.

### Customise the Port

Copy the example env file and edit it:

```powershell
Copy-Item .env.example .env
# Edit .env:  PORT=3001
```

### LAN / TV Access (Windows)

To allow other devices on your Wi-Fi (e.g. a Samsung TV) to reach the server, run the included firewall helper **as Administrator**:

```powershell
# Right-click → Run as Administrator
.\allow-firewall.bat
```

Then open `http://<your-PC-IP>:3001/display/` on the TV browser.

---

## 🏗️ Architecture

```
                       ┌──────────────────────────────────┐
                       │        CareCall Server            │
                       │   Node.js  ·  http  ·  ws         │
                       │                                   │
  Doctor Console  ────▶│  /ws (WebSocket)                  │
  Doctor Mobile   ────▶│    ↓ broadcast(state)             │
                       │  /display (sirv static)           │
                       └──────────┬───────────────────────┘
                                  │ simultaneous broadcast
                     ┌────────────┼────────────────┐
                  Display 1    Display 2         Mobile
                (Waiting TV) (Hall Monitor)   (Tablet)
```

### How a Call Flows

1. Doctor taps a number on any Doctor screen.
2. The browser sends `{ "type": "call", "number": "7" }` over WebSocket to `/ws`.
3. The server stores the call in memory (`state.js`) and calls `broadcast()` to every connected client.
4. Every Display screen receives `{ "type": "state", "cause": "call", "announcement": { "number": "7", "sentAt": … } }`.
5. Each Display renders the token number, starts an elapsed-time counter, and speaks the announcement in Telugu audio clips + English Web Speech API.

### WebSocket Engine

| File | Responsibility |
|---|---|
| `ws/attachWebSocketServer.js` | Mounts the WebSocket server on `/ws`, starts heartbeat |
| `ws/handleConnection.js` | Routes each connection to onConnect / onMessage / onClose |
| `ws/handlers/onConnect/` | Sends current state snapshot + notifies presence |
| `ws/handlers/onMessage/handleCall.js` | Saves call, broadcasts state to all clients |
| `ws/broadcast.js` | Sends JSON payload to every live client |
| `ws/state.js` | In-memory store for `{ number, sentAt }` |
| `ws/heartbeat.js` | 25-second ping/pong keep-alive (prevents TV timeouts) |

---

## 📺 Screen Gallery

### Home Gateway (`/`)
A polished dark-blue launcher with three card links — Waiting Display, Doctor Mobile, Doctor Console. Shows "Single Broadcast System" status badge.

### Doctor Console (`/dr/`)
- Telugu UI: **" డాక్టర్ కన్సోల్"**
- Full 0–9 keypad with Clear (`C`) and Backspace (`⌫`)
- **+1 తదుపరి** quick-next button
- Server connection pill (connected / disconnected)
- One-tap **"డిస్‌ప్లేకి పంపండి"** (Send to Display) button

### Waiting Display (`/display/`)
- Split-panel layout: **large token number** on the left, **info card** on the right
- Telugu labels: "టోకెన్ నంబర్ · TOKEN" and "గడిచిన సమయం · ELAPSED TIME"
- Department: "జనరల్ ఓపీ (General OP)"
- 🔊 Voice toggle button — tap once to unlock browser audio autoplay

### Doctor Mobile V-3 (`/mobile/v3/`) — Recommended
- No header band; maximises keypad space on small phones
- **Live status row** at top: connection pill + NOW SERVING active card side-by-side
- 🔔 **మళ్లీ పిలవండి** (Recall) button to re-broadcast the current token without re-dialling
- Bottom nav bar: quick links to Display and Doctor Console

---

## 🔊 Telugu Audio

Telugu voice clips are stored in `public/audio/te/` as `.wav` (numbers 1–10) and `.mp3` (numbers 11–30+). The Display screen's JavaScript assembles the correct clips to say **"నంబర్ [word]"** for each token.

> **Important**: Play back the clips on your clinic speakers before going live and confirm pronunciation is clear.

---

## 📂 Project Layout

```
appointment-notifier/
├── app.js                    # Entry point: HTTP + WebSocket server
├── package.json              # v1.2.1 · Node ESM · sirv + ws
├── .env.example              # PORT=3001
├── allow-firewall.bat        # Windows firewall helper (run as Admin)
│
├── public/                   # All HTML/CSS/JS served statically
│   ├── index.html            # 🏠 Home gateway
│   ├── display/              # 📺 Waiting area display screen
│   ├── dr/                   # 🩺 Doctor console (desktop)
│   ├── mobile/               # 📱 Doctor mobile (v1, v2, v3)
│   └── audio/te/             # 🔊 Telugu WAV/MP3 clips (1–30+)
│
├── ws/                       # WebSocket server engine
│   ├── attachWebSocketServer.js
│   ├── handleConnection.js
│   ├── broadcast.js
│   ├── state.js
│   ├── heartbeat.js
│   └── handlers/
│       ├── onConnect/
│       ├── onMessage/        # handleCall.js
│       └── onClose/
│
└── docs/                     # Technical documentation
    ├── overview.md
    ├── configuration.md
    ├── v14-multi-display-story.md
    ├── index.html
    └── publish-to-vps.html
```

---

## 🔧 Configuration

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | TCP port for HTTP and WebSocket |

The server binds to `0.0.0.0` (all network interfaces). It reads `.env` automatically when the file exists (Node.js 20.6+ native env loading — no `dotenv` package needed).

---

## 🔒 Security Notes

> [!WARNING]
> CareCall has **no authentication or TLS**. It is designed for use on a **trusted LAN**.

- Keep the server behind a router/firewall on a private network.
- For public/internet access, place it behind a reverse proxy (e.g. Caddy) with HTTPS and WSS.
- The `role` parameter in WebSocket URLs selects a channel only — it does not authenticate users.
- See **[VPS Publishing Runbook](docs/publish-to-vps.html)** for a full Caddy + Linux deployment guide.

---

## 📚 Documentation

| Doc | Description |
|---|---|
| [System Overview](docs/overview.md) | End-to-end request flow, architectural decisions |
| [Configuration Guide](docs/configuration.md) | Port, env file, LAN/firewall setup |
| [V14 Multi-Display Story](docs/v14-multi-display-story.md) | Deep-dive: multi-screen sync, audio autoplay, WebSocket design |
| [VPS Publishing Runbook](docs/publish-to-vps.html) | Host on Linux VPS behind Caddy (HTTPS/WSS) |

---

> [!NOTE]
> CareCall is a **calling & display system only**. It does not create appointments, store patient records, or persist call history. The server is stateless — restarting it clears the current token.

