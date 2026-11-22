const PING_INTERVAL_MS = 25000;

export function startHeartbeat(wss) {
  const timer = setInterval(() => {
    for (const client of wss.clients) {
      if (client.isAlive === false) {
        client.terminate();
        continue;
      }
      client.isAlive = false;
      if (client.readyState === 1) {
        client.ping();
      }
    }
  }, PING_INTERVAL_MS);

  wss.on("close", () => clearInterval(timer));

  return timer;
}
