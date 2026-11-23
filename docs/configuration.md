# CareCall — Configuration Guide

## Port Configuration

### Default port

The server defaults to port **3001** if no `PORT` environment variable is set.

### Custom port via `.env`

`.env.example` is a tracked template. The real `.env` file is optional and Git-ignored. To choose a custom port:

```powershell
Copy-Item .env.example .env
# Edit .env and set:
PORT=3001
```

The server reads `PORT` from `.env` automatically when the file exists (Node.js 20.6+ native env loading — no `dotenv` package needed).

> **Priority**: OS environment variable > `.env` file > built-in default (3001)

---

## Network Binding

```
server.listen(PORT, "0.0.0.0")
```

The server binds to **all network interfaces** (`0.0.0.0`). The same port serves both the HTTP pages and the WebSocket endpoint (`/ws`).

| Client | URL |
|---|---|
| Local browser | `http://localhost:3001/` |
| LAN device (phone, TV) | `http://<server-LAN-IP>:3001/` |
| VPS (behind Caddy) | `https://yourclinic.example.com/` |

---

## Screen URLs (all on one port)

| Screen | URL |
|---|---|
| Home gateway | `http://localhost:3001/` |
| Waiting Display | `http://localhost:3001/display/` |
| Doctor Console | `http://localhost:3001/dr/` |
| Doctor Mobile (picker) | `http://localhost:3001/mobile/` |
| Doctor Mobile V-1 | `http://localhost:3001/mobile/v1/` |
| Doctor Mobile V-2 | `http://localhost:3001/mobile/v2/` |
| Doctor Mobile V-3 | `http://localhost:3001/mobile/v3/` |

---

## Windows Firewall (LAN / TV access)

To allow a Samsung TV or another device on your Wi-Fi to reach the server, run the included helper **as Administrator**:

```powershell
# Right-click → Run as Administrator
.\allow-firewall.bat
```

This opens ports 3000 and 3001, allows Node.js through the firewall, and sets the Wi-Fi network profile to **Private** (required for inbound connections on Windows).

After running the script, open `http://<your-PC-LAN-IP>:3001/display/` in the TV's browser.

---

## VPS / Public Internet

For public deployment, place CareCall behind a reverse proxy with HTTPS and WSS. The recommended setup uses **Caddy** on a Linux VPS:

```
Browser ──HTTPS──▶ Caddy (443) ──HTTP──▶ CareCall (3001)
              └──WSS──▶ Caddy (443) ──WS──▶ CareCall (3001 /ws)
```

See the full **[VPS Publishing Runbook](publish-to-vps.html)** for step-by-step instructions.

---

## Environment Reference

| Variable | Type | Default | Description |
|---|---|---|---|
| `PORT` | integer | `3001` | TCP port for HTTP and WebSocket |

No other environment variables are currently used.
