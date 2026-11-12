# CareCall V15

V15 is a copy of V14. Earlier public versions remain unchanged.

- Doctor: `/v15/doctor/`
- Display: `/v15/display/`
- Uses the shared `/ws` endpoint and shared live state with V3–V15.
- Supports multiple display clients.
- English announcements use locally hosted MP3 clips for every number from 0 through 999. This avoids relying on the browser's Web Speech / speech-synthesis engine, which is missing or unreliable in some older Smart TV browsers.
- Telugu announcements continue to use the existing local WAV clips for numbers 1–10.
- Voice On and Test voice start local audio directly from the user's click, allowing the browser's audio playback policy to be satisfied where supported.

## Voice behavior

1. Open `/v15/display/`.
2. Select English or Telugu.
3. Press **Voice on** once. The display plays a short number sample.
4. Use **Test voice** to test again.
5. New calls play their matching local audio clip when voice is enabled.

English MP3 files are in `display/audio/en/000.mp3` through `999.mp3`.
