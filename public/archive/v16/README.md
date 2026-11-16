# CareCall V16 — DOM Primitive Bindings & Programmatic Audio

CareCall V16 rebuilds the Display and Doctor frontends on top of the **`dom-primitive-bindings`** declarative event delegation engine.

- Doctor Console: `/v16/doctor/`
- Display Screen: `/v16/display/`
- Uses shared `/ws` endpoint (`doctor-v16` and `display-v16` roles).
- Event wiring is driven by declarative `bindings.json` and executed via `actions.js`.
- Audio announcements run programmatically in Telugu (`te-IN`), sequencing digits for any called number.

