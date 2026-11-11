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
      numberElement.style.fontSize = "";
      elapsedElement.textContent = "Waiting for next call";
      return;
    }

    const number = String(announcement.number ?? "");
    numberElement.textContent = number;

    // Fill the screen with the number while keeping multi-digit values in bounds.
    const digitCount = Math.max(1, number.length);
    const heightLimit = window.innerHeight * 0.90;
    const widthLimit = window.innerWidth * 0.88 / (digitCount * 0.68);
    numberElement.style.fontSize = `${Math.max(80, Math.min(heightLimit, widthLimit))}px`;

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
