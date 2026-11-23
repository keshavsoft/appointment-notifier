# CareCall — Architecture & Roadmap

## 1. Screen Hierarchy & Navigation

CareCall follows a clear **single-channel, multi-screen** topology. Every screen connects to the same WebSocket hub and shares the same live token state.

```
                    ┌─────────────────────────────────┐
                    │      🏠 Home Gateway  ( / )      │
                    └────────────┬────────────────────┘
                                 │
           ┌─────────────────────┼──────────────────────┐
           ▼                     ▼                      ▼
    📺 Waiting Display     📱 Doctor Mobile        🩺 Doctor Console
       /display/              /mobile/                 /dr/
    (TV / monitor)         ┌────┬────┬────┐       (desktop workstation)
                           V-1  V-2  V-3
                        /mobile/v1/ /v2/ /v3/
```

**Navigation rules:**
- Every sub-page has a **← Home** breadcrumb back to `/`.
- Mobile V-3 has a **bottom nav bar** with quick-links to Display and Doctor Console.
- The Home gateway card grid (Display · Mobile · Doctor) is the single entry point.

---

## 2. Screen Role Summary

| Screen | Path | Role | Description |
|---|---|---|---|
| Home | `/` | — | Gateway launcher, three card links |
| Waiting Display | `/display/` | Passive receiver | Shows token, elapsed time, speaks audio |
| Doctor Console | `/dr/` | Sender | Full 0–9 keypad, +1 quick-next, send button |
| Doctor Mobile V-1 | `/mobile/v1/` | Sender | Original touch keypad with live token card |
| Doctor Mobile V-2 | `/mobile/v2/` | Sender | Compact (no brand header) |
| Doctor Mobile V-3 | `/mobile/v3/` | Sender | Status + live card in one row; bottom nav |

---

## 3. Version Evolution

| Version | Label | Status | Key Changes |
|---|---|---|---|
| **V-1 Mobile** | Original | ✅ Stable | First touch keypad; full header + live card |
| **V-2 Mobile** | Compact | ✅ Stable | Header stripped; more keypad space |
| **V-3 Mobile** | Recommended | ✅ **Active** | Inline status + NOW SERVING card; bottom nav; Recall button |
| **Display** | Current | ✅ **Active** | Split-panel TV layout; Telugu + elapsed time |
| **Dr Console** | Current | ✅ **Active** | Desktop workstation dialer; Telugu UI |

---

## 4. Single-Broadcast WebSocket Engine

All clients — senders and receivers — connect to a **single `/ws` endpoint**. There are no role-separated channels; every client receives the same broadcast.

```
Doctor (any version)
   │  { type: "call", number: "7" }
   ▼
ws/handlers/onMessage/handleCall.js
   ├── state.js  →  setCurrentCall("7")
   └── broadcast.js  →  sends state to ALL clients
              │
    ┌─────────┼──────────┐
 Display 1  Display 2  Mobile
(TV)       (Tablet)    (Doctor sees confirmation)
```

**Engine files:**

| File | Responsibility |
|---|---|
| `ws/attachWebSocketServer.js` | Mounts WSS on `/ws`; starts heartbeat |
| `ws/handleConnection.js` | Routes ws events |
| `ws/handlers/onConnect/index.js` | Sends state snapshot; notifies presence |
| `ws/handlers/onMessage/handleCall.js` | Saves call; full broadcast |
| `ws/handlers/onClose/index.js` | Notifies presence on disconnect |
| `ws/broadcast.js` | JSON send to all live clients |
| `ws/state.js` | In-memory `{ number, sentAt }` |
| `ws/heartbeat.js` | 25-second ping/pong keep-alive |

---

## 5. Audio System

| Layer | Technology | Coverage |
|---|---|---|
| **Telugu clips** | `.wav` (1–10) + `.mp3` (11–30+) | Served from `public/audio/te/` |
| **English speech** | Web Speech API (`speechSynthesis`) | Numbers and phrases |
| **Autoplay unlock** | `click / touchstart / keydown` global listeners | Satisfies browser autoplay policy |
| **Voice toggle** | 🔊 button on Display | Manual unlock / test |

---

## 6. Planned Roadmap

### Near-Term

- [ ] **Multi-room support** — Doctor selects which room/department to call (Room A, B, OPD, Lab)
- [ ] **Call history log** — in-memory ring buffer of last N calls visible on Doctor Console
- [ ] **Display theme selector** — light mode / high-contrast mode for different room lighting

### Mid-Term

- [ ] **Multi-channel architecture** — separate WebSocket topic per room; Display subscribes to its room
- [ ] **Admin dashboard** — online client count, last call, server uptime
- [ ] **PWA offline shell** — Doctor Mobile works without internet (caches keypad UI)

### Long-Term / V-Next

- [ ] **TLS / HTTPS** built-in via self-signed cert or ACME (Let's Encrypt) for direct internet deployment
- [ ] **PIN authentication** for Doctor screens
- [ ] **Persistent call log** — SQLite or append-only JSON file, clearable per session
- [ ] **Multi-language voice** — Hindi, Tamil, Kannada audio clip packs

---

## 7. Deployment Options

| Environment | Method | Notes |
|---|---|---|
| **Local LAN** | `npm start` + firewall open | Use `allow-firewall.bat` on Windows |
| **VPS (Linux)** | Node.js + Caddy reverse proxy | See `docs/publish-to-vps.html` |
| **Docker** | Containerise `app.js` on port 3001 | Planned |
| **Raspberry Pi** | Node.js ARM build | Community tested |

