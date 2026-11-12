# CareCall V12

V12 adds a diagnostic frontend and backend logging for WebSocket investigation.

- Doctor: `/v12/doctor/`
- Display: `/v12/display/`
- V12 uses isolated WebSocket roles: `doctor-v12` and `display-v12`.
- The backend writes append-only JSON-lines diagnostics to `logs/log.txt`.

Log events include upgrade requests, requested role, remote address, browser user-agent, origin, accepted connections, duplicate display detection, the exact close code/reason, and doctor calls.

Existing V3–V11 frontend folders and existing role mappings are retained. The only backend changes are V12 role registration and diagnostic logging; legacy role behavior is unchanged.
