# CareCall V10

V10 is an isolated frontend copy under `public/v10/`.

- Display: `/v10/display/`
- Doctor console: `/v10/doctor/`
- Stylesheet: `/v10/css/v10.css`
- All HTML, CSS, JavaScript modules and Telugu WAV assets are inside `/v10/`.

Display modules use corrected relative imports. The display WebSocket reconnects automatically after a disconnect and shows a small connection status indicator. It retains the existing `display-v5` / `doctor-v5` roles because the existing backend explicitly supports those roles and keeps V10 isolated from V4–V9 frontend assets.

The patient number remains the dominant full-screen element.
