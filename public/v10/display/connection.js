export function connectDisplay(onMessage, onStatus = () => {}) {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  let socket;
  let retryTimer;
  let stopped = false;

  function connect() {
    if (stopped) return;
    onStatus("Connecting");

    socket = new WebSocket(`${protocol}//${location.host}/ws?role=display-v5`);

    socket.addEventListener("open", () => onStatus("Connected"));

    socket.addEventListener("message", (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch (error) {
        console.error("Display received invalid WebSocket JSON:", error);
        return;
      }
      onMessage(message);
    });

    socket.addEventListener("error", (error) => {
      console.error("Display WebSocket error:", error);
      onStatus("Connection error");
    });

    socket.addEventListener("close", () => {
      onStatus("Disconnected — reconnecting");
      if (!stopped) retryTimer = setTimeout(connect, 2000);
    });
  }

  connect();

  return {
    close() {
      stopped = true;
      clearTimeout(retryTimer);
      socket?.close();
    }
  };
}
