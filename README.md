# CareCall Appointment Notifier

A lightweight, self-hosted caller for appointment or queue numbers. A staff member uses the Doctor screen to send a number to connected Display or Reception screens. Receiving screens show the number, speak it aloud in the browser, and display elapsed time.

Read the **[V14 Multi-Display Story](docs/v14-multi-display-story.md)** for a deep dive into the architecture, simultaneous multi-display audio broadcasting, and WebSocket design.

> [!NOTE]
> This is not a booking or patient-record system. It does not manage appointments, store personal health records, or persist call history.

---

## Quick Start

Requires Node.js 20.6 or later.

```powershell
npm install
npm start
```

By default, the server listens on port **3000** on all network interfaces. To customize the port, copy `.env.example` to `.env` and set `PORT=your_port`.

### Primary Endpoints (V14)

- **Doctor Console**: [http://localhost:3000/v14/doctor](http://localhost:3000/v14/doctor)
- **Queue Display**: [http://localhost:3000/v14/display](http://localhost:3000/v14/display)

Legacy routes (`/doctor`, `/display`, `/reception`) and earlier versions (`/v3`, `/v4`, `/v13`) remain accessible for backward compatibility.

---

## Core Capabilities (V14)

- **Simultaneous Multi-Display Broadcasting**: Multiple displays (waiting room TVs, hallway monitors, tablets) connect concurrently without knocking each other offline.
- **Bilingual Voice Announcements**: Full support for English (via Web Speech API) and local Telugu voice clips for numbers 1–10.
- **Resilient Audio Autoplay**: Click or tap anywhere on the screen to activate audio in any browser window.
- **Shared Live State & Heartbeat**: A 25-second WebSocket keep-alive ping prevents TV display timeouts, and dynamic role matching connects all clients to the shared call state.
- **Clean Diagnostics**: Optional WebSocket runtime diagnostics are appended to `logs/log.txt` (Git-ignored).

---

## Documentation

- **[V14 Multi-Display Story & Technical Architecture](docs/v14-multi-display-story.md)**: Sequence diagrams, role routing, and audio autoplay design.
- **[System Overview](docs/overview.md)**: Request flow and architectural principles.
- **[Configuration Guide](docs/configuration.md)**: Port configuration and environment variables.
- **[VPS Publishing Runbook](docs/publish-to-vps.html)**: Guide to hosting CareCall on a Linux VPS behind Caddy.
