# CareCall V11

V11 is an isolated frontend copy under `public/v11/`. It does not modify V10 or earlier versions.

- Display: `/v11/display/`
- Doctor console: `/v11/doctor/`
- Stylesheet: `/v11/css/v11.css`
- The V11 display and doctor scripts use classic JavaScript (no ES module imports).
- The existing backend and WebSocket endpoint `/ws` are intentionally unchanged.
- V11 retains the existing compatible WebSocket roles `display-v5` and `doctor-v5`.

The TV-facing display script includes display rendering, WebSocket reconnect handling, and voice controls in one classic script to avoid module-loader compatibility issues on older embedded browsers.
