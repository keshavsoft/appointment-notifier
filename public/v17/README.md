# CareCall V17 — Autonomous Self-Contained Apps & Anti-Clipping Typography

CareCall V17 establishes **Autonomous, Zero-Shared Directories** for the Display and Doctor frontends. There are zero common folders: every stylesheet, script, binding definition, audio clip, and markup asset lives entirely inside that component's directory.

## What's New in V17

1. **Complete Folder Autonomy (Zero Common Folders)**:
   - `display/` contains its own `index.html`, `index.js`, `actions.js`, `audio.js`, `bindings.json`, `dom-primitive-bindings.js`, `audio/te/`, and `css/`.
   - `doctor/` contains its own `index.html`, `index.js`, `actions.js`, `bindings.json`, `dom-primitive-bindings.js`, and `css/`.
   - No shared `/v17/css/` or `/v17/lib/` roots exist. Either application can be moved, modified, or deployed independently.

2. **Modular Component CSS (Inside Each Folder)**:
   - Each app has its own `css/` directory containing small, single-purpose component stylesheets (10–35 lines each), aggregated cleanly via `./css/style.css`.
   - If an HTML component is removed, its CSS can be removed without affecting anything else.

3. **English Token Number Right-Side Clipping Fix**:
   - Fixed in `display/css/number.css` where `.display-number` was previously clipped by `overflow: hidden;`.
   - Uses `overflow: visible;`, `padding-inline: 0.08em;`, relaxed `letter-spacing: -0.02em;`, and padded card container.

4. **Reliable Web Audio Across WebSockets**:
   - Features `unlockAudio()` with user gesture detection on `display` to prevent browser Media Autoplay Policy rejections on incoming WebSocket announcements.
   - Robust relative audio URL resolution via `import.meta.url`.

## Directory Structure

```
v17/
├── display/
│   ├── index.html
│   ├── index.js
│   ├── actions.js
│   ├── audio.js
│   ├── bindings.json
│   ├── dom-primitive-bindings.js
│   ├── audio/
│   │   └── te/
│   └── css/
│       ├── style.css
│       ├── base.css
│       ├── layout.css
│       ├── number.css
│       ├── telugu-spelling.css
│       ├── elapsed.css
│       ├── connection-status.css
│       └── voice-controls.css
│
└── doctor/
    ├── index.html
    ├── index.js
    ├── actions.js
    ├── bindings.json
    ├── dom-primitive-bindings.js
    └── css/
        ├── style.css
        ├── base.css
        ├── layout.css
        ├── tabs.css
        ├── status-pills.css
        ├── number-entry.css
        ├── keypad.css
        ├── send-button.css
        └── preview-screen.css
```
