# Local configuration

## `.env` and `.env.example`

`.env.example` is the tracked template. Create a local `.env` file from it:

```powershell
Copy-Item .env.example .env
```

The real `.env` is ignored by Git. It contains the port only, so each checkout can choose a local port without storing machine-specific IP addresses in the repository. `npm start` loads `.env` with Node's built-in `--env-file` option; no dotenv package is needed.

## Port and network access

```dotenv
PORT=3000
```

The same port serves the web pages and the WebSocket endpoint. It must be an integer from 1 through 65535. The server calls `server.listen(PORT)` without a host argument, so Node listens on the unspecified address across the machine's network interfaces. The operating system's assigned IP is then used in the URL; no `HOST` setting is needed.

On the server computer, open `http://localhost:3000/doctor`. On another device on the same network, use the server computer's LAN IP, for example `http://192.168.1.25:3000/doctor`. The Display and Reception paths are `/display` and `/reception`; V3 uses `/v3/doctor` and `/v3/display`. The browser builds its WebSocket URL from the page's host and port.

Because the app listens on all interfaces, network reachability depends on the firewall and network rules. For LAN use, allow the port only on the private network. For a VPS, put the app behind a reverse proxy such as Caddy and expose the proxy's HTTPS ports; this prototype has no user authentication or TLS of its own.
