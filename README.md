# CareCall Appointment Notifier

A lightweight, self-hosted caller for appointment or queue numbers. A staff member uses the Doctor screen to send a number to the Display or Reception screen. Receiving screens show and speak the number and show elapsed time.

Read the [project story](https://keshavsoft.github.io/appointment-notifier/) for a visual explanation of the app and its architecture, or follow the **[VPS Publishing Runbook](docs/publish-to-vps.html)** to host it live behind Caddy.

This is not a booking or patient-record system. It does not manage appointments, store personal records, or keep call history.

## Start locally

Requires Node.js 20.6 or later and npm.

Install and start:

```powershell
npm install
npm start
```

The `.env` file is optional. To choose a custom port, copy `.env.example` to `.env` and edit `PORT`. If neither `.env` nor the process environment sets `PORT`, the server uses port 2004. The real `.env` is ignored by Git.

By default, open `http://localhost:2004/doctor`. The server listens on all network interfaces, so other devices can use this computer's IP address with the configured port. See [configuration](docs/configuration.md).

## What runs here

The server uses Node.js's built-in `http` module to serve the static browser screens. The `ws` package provides a WebSocket endpoint on the same server for real-time announcements. The screens are plain HTML, CSS, and JavaScript; voice announcements use the browser's speech synthesis. There is no Express, database, or persistent storage.

## Frontend versions

The frontend is kept in `public/v1/`, `public/v2/`, `public/v3/`, and `public/v4/`. V1 and V2 remain available; the usual `/doctor`, `/display`, and `/reception` routes still open V2. V3 and V4 keep the focused Doctor-and-Display flow at `/v3/doctor`, `/v3/display`, `/v4/doctor`, and `/v4/display`. Both have a `Call` tab and a live `Display preview` tab, with separate live state. V4 adds a voice toggle and English speech; Telugu is reserved for supplied WAV files.

See [the project story and architecture](docs/overview.md) for the request flow and current limits.

## npm

This is a runnable application, not a reusable npm library. npm installs the `ws` dependency and runs the start script; `"private": true` in `package.json` prevents accidental publication to the npm registry.
