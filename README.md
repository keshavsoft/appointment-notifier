# CareCall Appointment Notifier

A small, self-hosted tool for calling appointment or queue numbers. The doctor console sends a number to either a display screen or a reception screen. The receiving screen shows the number, announces it with browser speech synthesis, and shows how long ago it was called.

This is a calling/notification tool, not an appointment booking system: it does not manage calendars, patient records, or bookings.

## How it works

- Node.js's built-in `http` module serves the pages and static files from `public/`.
- The `ws` package handles a WebSocket endpoint at `/ws` on that same HTTP server. It lets the doctor console send announcements to connected display or reception screens in real time.
- The browser interface uses plain HTML, CSS, and JavaScript. Speech uses the browser's built-in speech synthesis.
- There is no Express server, database, or saved call history. Connected screens and channel state live in memory while the server runs.

## Requirements

- Node.js 20.6 or later
- npm

## Configure and run

Copy `.env.example` to `.env`:

```powershell
Copy-Item .env.example .env
```

Set the bind address and port in `.env`:

```dotenv
HOST=127.0.0.1
PORT=3000
```

The default `127.0.0.1` makes the app available only on the same computer. To use other devices on the local network, set `HOST` to this computer's private LAN IPv4 address, for example `192.168.1.25`. Those devices can then open:

- Doctor console: `http://192.168.1.25:3000/doctor`
- Display screen: `http://192.168.1.25:3000/display`
- Reception screen: `http://192.168.1.25:3000/reception`

Replace the example address and port with the values for your setup. If needed, allow that port through the computer's firewall for the private network only.

Then install the dependency and start the server:

```sh
npm install
npm start
```

The browser screens connect to the WebSocket endpoint on the same host and port used to open them.

## Screens

- **Doctor:** two independent tabs for Display and Reception, each with its own keypad and selected number. Numbers can be up to three digits; Clear and backspace are available.
- **Display and Reception:** each receives only announcements sent to its own channel. On each screen, tap **Enable voice announcements** once; browsers require a user gesture before speech can play.

## Network and security

Binding to a specific IP controls which network interface accepts connections. It does not authenticate users. The app has no role authentication, HTTPS/WSS, or access control, so anyone who can reach it may connect. Keep it on a trusted local network; do not expose it to the public internet or forward its port until authentication and TLS are added.

## npm

This repository is a runnable application, not a reusable npm library. npm is used to install the `ws` dependency and run the start script. `package.json` sets `private: true` to prevent accidental publication to the npm registry.
