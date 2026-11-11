# CareCall V7

V7 is an isolated frontend copy of V6. All V7 CSS, HTML, JavaScript modules, and Telugu audio assets are served from `/v7/` only.

- Display: `/v7/display/`
- Doctor console: `/v7/doctor/`
- Stylesheet: `/v7/css/v7.css`

The existing application backend and WebSocket endpoint (`/ws`) remain shared so V7 can communicate with the same appointment server. WebSocket role identifiers are intentionally retained for backend compatibility.

No V4, V5, or V6 frontend asset paths are referenced by V7 pages or modules.
