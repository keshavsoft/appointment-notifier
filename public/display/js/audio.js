export function createAudioContext() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  return Audio ? new Audio() : null;
}

export function resumeAudioContext(ctx) {
  if (ctx && ctx.state === "suspended") {
    ctx.resume();
  }
}

export function playAnnouncementAudio(ctx, cache, numStr) {
  const n = Number(numStr);
  if (!isFinite(n) || n < 1 || n > 99 || !ctx) return;

  const fname = n <= 10 ? ((n < 10 ? "0" : "") + n + ".wav") : (n + ".mp3");
  const url = "/audio/te/" + fname;

  if (cache[url]) {
    const src = ctx.createBufferSource();
    src.buffer = cache[url];
    src.connect(ctx.destination);
    src.start(0);
    return;
  }

  fetch(url)
    .then((r) => r.arrayBuffer())
    .then((buf) => ctx.decodeAudioData(buf))
    .then((decoded) => {
      cache[url] = decoded;
      const src = ctx.createBufferSource();
      src.buffer = decoded;
      src.connect(ctx.destination);
      src.start(0);
    });
}
