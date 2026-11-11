function formatElapsed(milliseconds) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;

  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export function createDisplayView(root) {
  const numberElement = root.querySelector("[data-display-number]");
  const elapsedElement = root.querySelector("[data-display-elapsed]");
  let announcement = null;

  function render() {
    if (!announcement) {
      numberElement.textContent = "";
      elapsedElement.textContent = "Waiting for next call";
      return;
    }

    numberElement.textContent = announcement.number;
    elapsedElement.textContent = `Called ${formatElapsed(Date.now() - announcement.sentAt)} ago`;
  }

  render();
  const timer = setInterval(render, 1000);

  return {
    update(nextAnnouncement) {
      announcement = nextAnnouncement;
      render();
    },
    destroy() {
      clearInterval(timer);
    }
  };
}
