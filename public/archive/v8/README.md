# CareCall V8

V8 is copied from V7 and is self-contained under `public/v8/`.

- Display: `/v8/display/`
- Doctor console: `/v8/doctor/`
- Stylesheet: `/v8/css/v8.css`
- JavaScript modules, shared display renderer, voice controls, and Telugu WAV files are all under `/v8/`.

V8 keeps the existing `/ws` backend endpoint and existing WebSocket role names for compatibility with the current server.

The display no longer renders a giant em-dash placeholder while waiting for a call. Its TV layout uses responsive sizing with CSS pixel clamps rather than scaling all text from viewport height.
