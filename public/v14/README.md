# CareCall V14

V14 is copied from V13. Earlier public versions remain unchanged.

- Doctor: `/v14/doctor/`
- Display: `/v14/display/`
- Uses the same `/ws` WebSocket endpoint and shared live state as V3–V13.
- Multiple display clients may stay connected; calls are broadcast to all connected displays.
- The backend no longer closes an existing display with code 4001 when another display connects.
- Voice On plays a short sample within the user's click gesture to help unlock browser audio.
- Runtime WebSocket logs are newline-delimited JSON in `logs/log.txt`; `/logs/` is Git-ignored.
