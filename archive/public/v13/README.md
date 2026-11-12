# CareCall V13

V13 is a fresh frontend and WebSocket backend copy based on V11. Existing public versions are preserved.

- Doctor: `/v13/doctor/`
- Display: `/v13/display/`
- The V11 display configuration, English/Telugu voice selection, Telugu audio clips, and doctor preview are retained.
- V13 makes the waiting message and all display voice controls readable on a large TV.
- Doctor and display clients reconnect automatically after a WebSocket interruption.
- V13 uses `doctor-v13` and `display-v13` roles.
- All versioned doctor/display role aliases (V3–V13) now share one live state in the new `ws-v13/` backend. This allows mixed version clients to communicate through the same display state.
- The legacy `ws/` folder is retained but is no longer used by `app.js`.
- The previous `ws-/` implementation is preserved in `archive/ws-legacy/`.
- WebSocket logs are newline-delimited JSON in `logs/log.txt`.

## WebSocket diagnostics

The backend logs upgrade requests, accepted roles, connection IDs, browser user agents, display replacement, doctor registration, call validation, calls, close codes/reasons, and heartbeat timeouts. A 25-second ping/pong heartbeat detects stale connections.
