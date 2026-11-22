export function createWebSocket(handlers) {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const url = `${protocol}//${window.location.host}/ws`;
  const socket = new WebSocket(url);

  socket.onopen = handlers.onOpen;
  socket.onclose = handlers.onClose;
  socket.onmessage = handlers.onMessage;

  return socket;
}

export function closeWebSocket(socket) {
  if (!socket) return;
  socket.onopen = null;
  socket.onclose = null;
  socket.onmessage = null;
  socket.close();
}
