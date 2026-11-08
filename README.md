# CareCall Appointment Notifier — V2

V2 is a separate copy. V1 is not modified.

## Run
```bash
npm install
npm start
```

Open the doctor console at `http://localhost:3000/doctor`, the large display at `/display`, and the reception screen at `/reception`.

## Doctor console
Both tabs have independent 0–9 keypads and a Send button. The Display tab sends only to connected display screens. The Reception tab sends only to connected reception screens. Each tab keeps its own selected number; Clear and backspace are available. Numbers can be up to three digits.

## Receiving screens
The target screen shows the number in large type, speaks it using browser speech synthesis, and displays elapsed time since it arrived. On each receiving screen, tap **Enable voice announcements** once; browsers require a user gesture before speech can play.

## Stack
Node.js built-in HTTP server, one `ws` WebSocket endpoint, plain HTML/CSS/JavaScript. One port is used; `display` and `reception` are logical channels.

## Deployment note
This is a prototype without role authentication. Before exposing it to the public internet, add authentication, HTTPS/WSS, and access controls.
