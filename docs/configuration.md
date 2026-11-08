# Local configuration

## `.env` and `.env.example`

`.env.example` is the tracked template. Create a local `.env` file from it and edit that file for the machine running the server:

```powershell
Copy-Item .env.example .env
```

The real `.env` is ignored by Git because it can contain machine-specific addresses or private settings. A fresh clone will not contain `.env`; each checkout must create its own copy. `npm start` loads `.env` with Node's built-in `--env-file` option, so no dotenv package is needed.

## Bind address and port

```dotenv
HOST=127.0.0.1
PORT=3000
```

- `HOST` is the local network interface address on which the server listens. `127.0.0.1` allows access only from the same computer.
- `PORT` is the TCP port used for both the HTTP pages and the WebSocket endpoint. It must be an integer from 1 through 65535.

To connect screens on other devices on the same private network, set `HOST` to the server computer's private LAN IPv4 address, for example `192.168.1.25`. Open the screens using that address and the configured port:

- `http://192.168.1.25:3000/doctor`
- `http://192.168.1.25:3000/display`
- `http://192.168.1.25:3000/reception`

Substitute the actual address and port. If the computer's firewall blocks the connection, allow the configured port for the private network only. The pages choose their WebSocket URL from the address used to open them, so the browser screens do not need a separate WebSocket address setting.

Binding to a particular IP is a network-interface choice, not a security boundary. The application has no user authentication and uses unencrypted HTTP/WebSocket. Do not port-forward it or expose it to the public internet.
