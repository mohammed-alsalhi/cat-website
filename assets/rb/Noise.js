// Noise — vanilla port of React Bits <Noise>. Appends a pointer-transparent
// grain canvas overlay to `el` (position the container relative/fixed yourself).

function injectStyle() {
  if (document.querySelector('style[data-rb="Noise"]')) return;
  const s = document.createElement('style');
  s.setAttribute('data-rb', 'Noise');
  s.textContent = `
.noise-overlay {
  position: absolute;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  image-rendering: pixelated;
}
`;
  document.head.appendChild(s);
}

export default function mount(el, opts = {}) {
  const {
    patternSize = 250,
    patternScaleX = 1,
    patternScaleY = 1,
    patternRefreshInterval = 2,
    patternAlpha = 15
  } = opts;
  // patternSize/patternScaleX/patternScaleY are accepted for prop parity; the
  // source declares but never reads them (canvas is a fixed 1024px grain).
  void patternSize; void patternScaleX; void patternScaleY;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  injectStyle();
  const canvas = document.createElement('canvas');
  canvas.className = 'noise-overlay';
  el.appendChild(canvas);

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return { destroy() { canvas.remove(); } };

  let frame = 0;
  let animationId = null;
  const canvasSize = 1024;

  const resize = () => {
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    if (reduced) drawGrain();
  };

  const drawGrain = () => {
    const imageData = ctx.createImageData(canvasSize, canvasSize);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const value = Math.random() * 255;
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = patternAlpha;
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const loop = () => {
    if (frame % patternRefreshInterval === 0) drawGrain();
    frame++;
    animationId = requestAnimationFrame(loop);
  };
  const start = () => {
    if (animationId == null) animationId = requestAnimationFrame(loop);
  };
  const stop = () => {
    if (animationId != null) cancelAnimationFrame(animationId);
    animationId = null;
  };
  const onVisibility = () => (document.hidden ? stop() : start());

  window.addEventListener('resize', resize);
  resize();

  if (reduced) {
    drawGrain();
  } else {
    document.addEventListener('visibilitychange', onVisibility);
    if (!document.hidden) start();
  }

  return {
    destroy() {
      stop();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.remove();
    }
  };
}
