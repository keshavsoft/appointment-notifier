import { loadConfig } from "./server/config.js";
import { createHttpServer } from "./server/http/createHttpServer.js";
import { attachWebSocketServer } from "./ws-v13/attachWebSocketServer.js";
import { startServer } from "./server/startServer.js";

function start() {
    let config;

    try {
        config = loadConfig();
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
        return;
    }

    const server = createHttpServer();
    attachWebSocketServer(server);
    startServer(server, config);
}

start();
