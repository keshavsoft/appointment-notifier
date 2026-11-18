# CareCall Architecture & Navigation Roadmap

## 1. Clean Navigation Hierarchy

CareCall now features a structured, drill-down and drill-back navigation tree:

```
                      [ 🏠 Home (index.html) ]
                     /                        \
      [ 🧪 Testing Hub (/testing/) ]      [ 🗂️ Versions Hub (/versions/) ]
          ├── TV Audio Sequence (V3)          ├── V18 Menu (/v18/)
          ├── Audio Diagnostics Hub           │     ├── 👨‍⚕️ Doctor Console (/v18/doctor/)
          ├── Single Clip Test (V1/V2)        │     └── 📺 TV Display Screen (/v18/display/)
          ├── Live Display Check (V18)        ├── V19 Menu (/v19/)
          └── Live Doctor Check (V18)         │     ├── 👨‍⚕️ Doctor Console (/v19/doctor/)
                                              │     └── 📺 TV Display Screen (/v19/display/)
                                              ├── V17 Menu (/v17/)
                                              │     ├── 👨‍⚕️ Doctor Console (/v17/doctor/)
                                              │     └── 📺 TV Display Screen (/v17/display/)
                                              └── V20 Roadmap (/v20/)
                                                    ├── 👨‍⚕️ Doctor Multi-Room (Preview)
                                                    └── 📺 Multi-Screen TV (Preview)
```

---

## 2. Navigation Rules & Drill-Back Buttons

Every sub-page has clear badges and drill-back buttons:
- **Doctor & Display screens**: Have topbar pills linking directly to:
  - `📂 Version Menu` (e.g. `/v18/` or `/v19/`)
  - `🗂️ Versions Hub` (`/versions/`)
  - `🏠 Home` (`/`)
- **Version Menus (`/v17/`, `/v18/`, `/v19/`, `/v20/`)**:
  - Present **exactly two main cards**: `👨‍⚕️ Doctor Console` and `📺 Display Screen`.
  - Provide drill-back buttons to `← 🗂️ Versions` and `🏠 Home`.
- **Testing Hub (`/testing/`)**:
  - Contains TV audio sequence tests, basic clip tests, and live screen checks.
  - Drill-back button to `← 🏠 Home`.
- **Home (`/index.html`)**:
  - Ultra-clean, uncluttered presentation with **exactly 2 primary cards**: `🧪 Testing` and `🗂️ Versions`.

---

## 3. Releases & Evolution

| Version | Status | Highlights |
|---|---|---|
| **V17** | Legacy | First autonomous folder architecture with zero shared CSS/JS. |
| **V18** | **Active Stable** | Verified TV Audio Engine with Web Audio API buffers, audio keep-alive heartbeat, persistent audio element fallback, and Telugu speech. |
| **V19** | **Ready for Custom UI** | Autonomous structure cloned from V18 with TV audio engine pre-wired; ready for UI modification proposal. |
| **V20** | **Future Roadmap** | Multi-room consultation calling, doctor room routing, and bilingual speech (Telugu + English). |
