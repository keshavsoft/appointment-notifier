# Local configuration

## Optional `.env` file

`.env.example` is a tracked template. The real `.env` file is optional and ignored by Git. To choose a custom port locally, copy the template:

```powershell
Copy-Item .env.example .env
```

The server reads `PORT` from `.env` when the file exists. A `PORT` value supplied by the operating system takes precedence. If neither source provides a port, the server defaults to `2004`. No dotenv package or Node command-line env-file option is required.

## Port and network access

```dotenv
PORT=2004
```

The same port serves the web pages and the WebSocket endpoint. It must be an integer from 1 through 65535. The server calls `server.listen(PORT)` without a host argument, so Node listens on the unspecified address across the machine's network interfaces. The operating system's assigned IP is then used in the URL; no `HOST` setting is needed.

On the server computer, open `http://localhost:2004/doctor`. On another device on the same network, use the server computer's LAN IP, for example `http://192.168.1.25:2004/doctor`. The Display and Reception paths are `/display` and `/reception`; V3 uses `/v3/doctor` and `/v3/display`. The browser builds its WebSocket URL from the page's host and port.

Because the app listens on all interfaces, network reachability depends on the firewall and network rules. For LAN use, allow the port only on the private network. For a VPS, put the app behind a reverse proxy such as Caddy and expose the proxy's HTTPS ports; this prototype has no user authentication or TLS of its own.
