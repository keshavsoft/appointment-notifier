export function broadcast(wss, data, sender = null) {
  const payload = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client.readyState === 1 && client !== sender) {
      client.send(payload);
    }
  }
}

export function notifyPresence(wss) {
  broadcast(wss, {
    type: "presence",
    onlineCount: wss.clients.size
  });
}
