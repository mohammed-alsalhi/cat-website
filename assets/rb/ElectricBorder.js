// ElectricBorder — vanilla port of React Bits <ElectricBorder>.
// Wraps `el`'s existing children in the source's DOM tree:
//   el.electric-border > .eb-canvas-container > canvas.eb-canvas
//                      > .eb-layers > .eb-glow-1 + .eb-glow-2 + .eb-background-glow
//                      > .eb-content > (original children)

const CSS = `
.electric-border {
  position: relative;
  overflow: visible;
  isolation: isolate;
}
.eb-canvas-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 2;
}
.eb-canvas { display: block; }
.eb-content {
  position: relative;
  border-radius: inherit;
  z-index: 1;
}
.eb-layers {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 0;
}
.eb-glow-1, .eb-glow-2, .eb-background-glow {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  box-sizing: border-box;
}
.eb-glow-1 {
  border: var(--eb-thickness, 2px) solid color-mix(in srgb, var(--electric-border-color) 60%, transparent);
  filter: blur(1px);
}
.eb-glow-2 {
  border: var(--eb-thickness, 2px) solid var(--electric-border-color);
  filter: blur(4px);
}
.eb-background-glow {
  z-index: -1;
  transform: scale(1.1);
  filter: blur(32px);
  opacity: 0.3;
  background: linear-gradient(-30deg, var(--electric-border-color), transparent, var(--electric-border-color));
}
`;

function injectStyle() {
  if (document.querySelector('style[data-rb="ElectricBorder"]')) return;
  const s = document.createElement('style');
  s.setAttribute('data-rb', 'ElectricBorder');
  s.textContent = CSS;
  document.head.appendChild(s);
}

// Noise helpers (verbatim from source)
function random(x) {
  return (Math.sin(x * 12.9898) * 43758.5453) % 1;
}

function noise2D(x, y) {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = x - i;
  const fy = y - j;

  const a = random(i + j * 57);
  const b = random(i + 1 + j * 57);
  const c = random(i + (j + 1) * 57);
  const d = random(i + 1 + (j + 1) * 57);

  const ux = fx * fx * (3.0 - 2.0 * fx);
  const uy = fy * fy * (3.0 - 2.0 * fy);

  return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
}

function octavedNoise(x, octaves, lacunarity, gain, baseAmplitude, baseFrequency, time, seed, baseFlatness) {
  let y = 0;
  let amplitude = baseAmplitude;
  let frequency = baseFrequency;

  for (let i = 0; i < octaves; i++) {
    let octaveAmplitude = amplitude;
    if (i === 0) {
      octaveAmplitude *= baseFlatness;
    }
    y += octaveAmplitude * noise2D(frequency * x + seed * 100, time * frequency * 0.3);
    frequency *= lacunarity;
    amplitude *= gain;
  }

  return y;
}

function getCornerPoint(centerX, centerY, radius, startAngle, arcLength, progress) {
  const angle = startAngle + progress * arcLength;
  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle)
  };
}

function getRoundedRectPoint(t, left, top, width, height, radius) {
  const straightWidth = width - 2 * radius;
  const straightHeight = height - 2 * radius;
  const cornerArc = (Math.PI * radius) / 2;
  const totalPerimeter = 2 * straightWidth + 2 * straightHeight + 4 * cornerArc;
  const distance = t * totalPerimeter;

  let accumulated = 0;

  if (distance <= accumulated + straightWidth) {
    const progress = (distance - accumulated) / straightWidth;
    return { x: left + radius + progress * straightWidth, y: top };
  }
  accumulated += straightWidth;

  if (distance <= accumulated + cornerArc) {
    const progress = (distance - accumulated) / cornerArc;
    return getCornerPoint(left + width - radius, top + radius, radius, -Math.PI / 2, Math.PI / 2, progress);
  }
  accumulated += cornerArc;

  if (distance <= accumulated + straightHeight) {
    const progress = (distance - accumulated) / straightHeight;
    return { x: left + width, y: top + radius + progress * straightHeight };
  }
  accumulated += straightHeight;

  if (distance <= accumulated + cornerArc) {
    const progress = (distance - accumulated) / cornerArc;
    return getCornerPoint(left + width - radius, top + height - radius, radius, 0, Math.PI / 2, progress);
  }
  accumulated += cornerArc;

  if (distance <= accumulated + straightWidth) {
    const progress = (distance - accumulated) / straightWidth;
    return { x: left + width - radius - progress * straightWidth, y: top + height };
  }
  accumulated += straightWidth;

  if (distance <= accumulated + cornerArc) {
    const progress = (distance - accumulated) / cornerArc;
    return getCornerPoint(left + radius, top + height - radius, radius, Math.PI / 2, Math.PI / 2, progress);
  }
  accumulated += cornerArc;

  if (distance <= accumulated + straightHeight) {
    const progress = (distance - accumulated) / straightHeight;
    return { x: left, y: top + height - radius - progress * straightHeight };
  }
  accumulated += straightHeight;

  const progress = (distance - accumulated) / cornerArc;
  return getCornerPoint(left + radius, top + radius, radius, Math.PI, Math.PI / 2, progress);
}

export default function mount(el, opts = {}) {
  const { color = '#FFCD11', speed = 1, chaos = 0.12, thickness = 2, borderRadius = 24 } = opts;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  injectStyle();

  // Build the DOM tree around el's current children.
  const container = el;
  container.classList.add('electric-border');
  container.style.setProperty('--electric-border-color', color);
  container.style.setProperty('--eb-thickness', `${thickness}px`);
  container.style.borderRadius = `${borderRadius}px`;

  const content = document.createElement('div');
  content.className = 'eb-content';
  while (container.firstChild) content.appendChild(container.firstChild);

  const canvasContainer = document.createElement('div');
  canvasContainer.className = 'eb-canvas-container';
  const canvas = document.createElement('canvas');
  canvas.className = 'eb-canvas';
  canvasContainer.appendChild(canvas);

  const layers = document.createElement('div');
  layers.className = 'eb-layers';
  for (const cls of ['eb-glow-1', 'eb-glow-2', 'eb-background-glow']) {
    const d = document.createElement('div');
    d.className = cls;
    layers.appendChild(d);
  }

  container.append(canvasContainer, layers, content);

  const ctx = canvas.getContext('2d');
  if (!ctx) return { destroy: unwrap };

  // Configuration (source constants)
  const octaves = 10;
  const lacunarity = 1.6;
  const gain = 0.7;
  const amplitude = chaos;
  const frequency = 10;
  const baseFlatness = 0;
  const displacement = 60;
  const borderOffset = 60;

  let animationRef = null;
  let time = 0;
  let lastFrameTime = 0;

  const updateSize = () => {
    const rect = container.getBoundingClientRect();
    const width = rect.width + borderOffset * 2;
    const height = rect.height + borderOffset * 2;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    return { width, height };
  };

  let { width, height } = updateSize();
  let lastDpr = Math.min(window.devicePixelRatio || 1, 2);

  const drawElectricBorder = currentTime => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (dpr !== lastDpr) {
      lastDpr = dpr;
      const newSize = updateSize();
      width = newSize.width;
      height = newSize.height;
    }

    const deltaTime = (currentTime - lastFrameTime) / 1000;
    time += deltaTime * speed;
    lastFrameTime = currentTime;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = color;
    ctx.lineWidth = thickness / 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const scale = displacement;
    const left = borderOffset;
    const top = borderOffset;
    const borderWidth = width - 2 * borderOffset;
    const borderHeight = height - 2 * borderOffset;
    const maxRadius = Math.min(borderWidth, borderHeight) / 2;
    const radius = Math.min(borderRadius, maxRadius);

    const approximatePerimeter = 2 * (borderWidth + borderHeight) + 2 * Math.PI * radius;
    const sampleCount = Math.floor(approximatePerimeter / 2);

    ctx.beginPath();

    for (let i = 0; i <= sampleCount; i++) {
      const progress = i / sampleCount;
      const point = getRoundedRectPoint(progress, left, top, borderWidth, borderHeight, radius);
      const xNoise = octavedNoise(progress * 8, octaves, lacunarity, gain, amplitude, frequency, time, 0, baseFlatness);
      const yNoise = octavedNoise(progress * 8, octaves, lacunarity, gain, amplitude, frequency, time, 1, baseFlatness);
      const displacedX = point.x + xNoise * scale;
      const displacedY = point.y + yNoise * scale;
      if (i === 0) ctx.moveTo(displacedX, displacedY);
      else ctx.lineTo(displacedX, displacedY);
    }

    ctx.closePath();
    ctx.stroke();

    if (!reduced) animationRef = requestAnimationFrame(drawElectricBorder);
  };

  const resizeObserver = new ResizeObserver(() => {
    const newSize = updateSize();
    width = newSize.width;
    height = newSize.height;
    if (reduced) drawElectricBorder(lastFrameTime);
  });
  resizeObserver.observe(container);

  const start = () => {
    if (animationRef != null) return;
    lastFrameTime = performance.now();
    animationRef = requestAnimationFrame(drawElectricBorder);
  };
  const stop = () => {
    if (animationRef != null) cancelAnimationFrame(animationRef);
    animationRef = null;
  };
  const onVisibility = () => (document.hidden ? stop() : start());

  if (reduced) {
    drawElectricBorder(0);
  } else {
    document.addEventListener('visibilitychange', onVisibility);
    if (!document.hidden) start();
  }

  function unwrap() {
    while (content.firstChild) container.appendChild(content.firstChild);
    canvasContainer.remove();
    layers.remove();
    content.remove();
    container.classList.remove('electric-border');
    container.style.removeProperty('--electric-border-color');
    container.style.removeProperty('--eb-thickness');
    container.style.removeProperty('border-radius');
  }

  return {
    destroy() {
      stop();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      unwrap();
    }
  };
}
