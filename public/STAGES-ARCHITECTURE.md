# Progressive Staging Architecture

A 3-tier evolutionary architecture separating **Presentation**, **Interaction**, and **Network Communication** into distinct, self-contained directories.

```
public/
│
├── ui/                              <── TIER 1: PURE PRESENTATION SANDBOX
│   └── v1/
│       ├── display/
│       │   ├── index.html           (Consumes only stage-1/css/)
│       │   └── stage-1/
│       │       └── css/             (Pure CSS components)
│       └── doctor/
│           ├── index.html           (Consumes only stage-1/css/)
│           └── stage-1/
│               └── css/             (Pure CSS components)
│
├── interaction/                     <── TIER 2: OFFLINE INTERACTIVE SANDBOX
│   └── v1/
│       ├── display/
│       │   ├── index.html           (Consumes stage-1/css/ + stage-2/js/)
│       │   ├── stage-1/
│       │   │   └── css/             (Stage 1 CSS)
│       │   └── stage-2/
│       │       ├── audio/           (Telugu audio clips)
│       │       └── js/              (Local UI controller, audio logic, bindings.json)
│       └── doctor/
│           ├── index.html           (Consumes stage-1/css/ + stage-2/js/)
│           ├── stage-1/
│           │   └── css/             (Stage 1 CSS)
│           └── stage-2/
│               └── js/              (Keypad interaction logic, bindings.json)
│
└── ws/                              <── TIER 3: LIVE WEBSOCKET PRODUCTION
    └── v1/
        ├── display/
        │   ├── index.html           (Consumes stage-1/css/ + stage-2/js/ + stage-3/js/)
        │   ├── stage-1/
        │   │   └── css/             (Stage 1 CSS)
        │   ├── stage-2/
        │   │   ├── audio/           (Audio clips)
        │   │   └── js/              (Local UI controller & audio)
        │   └── stage-3/
        │       └── js/              (WebSocket Client Transport)
        └── doctor/
            ├── index.html           (Consumes stage-1/css/ + stage-2/js/ + stage-3/js/)
            ├── stage-1/
            │   └── css/             (Stage 1 CSS)
            ├── stage-2/
            │   └── js/              (Keypad interaction logic)
            └── stage-3/
                └── js/              (WebSocket Client Transport)
```

## The 3 Tiers

1. **`ui/` (Presentation)**:
   - Contains `index.html` + `stage-1/css/`.
   - Zero JavaScript. Open in any browser to verify visual layout, cards, and typography.

2. **`interaction/` (Offline Behavior & Sound)**:
   - Contains `index.html` + `stage-1/css/` + `stage-2/js/`.
   - Fully interactive offline sandbox. Tests keypad typing, clear, backspace, and sound playback without any network server running.

3. **`ws/` (Live Production)**:
   - Contains `index.html` + `stage-1/css/` + `stage-2/js/` + `stage-3/js/`.
   - Complete real-time production system. `stage-3/js/ws-client.js` is a thin network adapter that hooks cleanly into `stage-2/js/ui.js`.

