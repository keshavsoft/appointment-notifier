export function createMobileWebSocket(handlers) {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const url = `${protocol}//${window.location.host}/ws`;
  const socket = new WebSocket(url);

  socket.onopen = handlers.onOpen;
  socket.onclose = handlers.onClose;
  socket.onerror = handlers.onError;
  socket.onmessage = handlers.onMessage;

  return socket;
}

export function closeMobileWebSocket(socket) {
  if (!socket) return;
  socket.onopen = null;
  socket.onclose = null;
  socket.onerror = null;
  socket.onmessage = null;
  socket.close();
}
