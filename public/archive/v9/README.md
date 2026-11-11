# CareCall V9

V9 is an isolated copy of V8 under `public/v9/`.

- Display: `/v9/display/`
- Doctor console: `/v9/doctor/`
- Stylesheet: `/v9/css/v9.css`
- All V9 HTML, CSS, JavaScript modules, shared display renderer, voice controls, settings, and Telugu WAV clips are inside this folder.

The display is number-first: the patient number is sized from the available viewport height and width, with automatic fitting for multi-digit numbers. The elapsed-time line remains secondary and voice controls stay in a small bottom corner.

The existing `/ws` backend endpoint and WebSocket role identifiers remain shared for compatibility with the current appointment server.
