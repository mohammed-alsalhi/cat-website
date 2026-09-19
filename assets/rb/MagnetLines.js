// MagnetLines — vanilla port of React Bits <MagnetLines>.
// `el` becomes the grid container; rows*columns <span> lines are appended to it.

function injectStyle() {
  if (document.querySelector('style[data-rb="MagnetLines"]')) return;
  const s = document.createElement('style');
  s.setAttribute('data-rb', 'MagnetLines');
  s.textContent = `
.magnetLines-container {
  display: grid;
  justify-items: center;
  align-items: center;
}
.magnetLines-container span {
  display: block;
  transform-origin: center;
  will-change: transform;
  transform: rotate(var(--rotate));
}
`;
  document.head.appendChild(s);
}

export default function mount(el, opts = {}) {
  const {
    rows = 9,
    columns = 9,
    containerSize = '80vmin',
    lineColor = '#efefef',
    lineWidth = '1vmin',
    lineHeight = '6vmin',
    baseAngle = -10
  } = opts;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  injectStyle();
  const container = el;
  container.classList.add('magnetLines-container');
  Object.assign(container.style, {
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
    width: containerSize,
    height: containerSize
  });

  const items = [];
  for (let i = 0; i < rows * columns; i++) {
    const span = document.createElement('span');
    span.style.setProperty('--rotate', `${baseAngle}deg`);
    Object.assign(span.style, { backgroundColor: lineColor, width: lineWidth, height: lineHeight });
    container.appendChild(span);
    items.push(span);
  }

  const onPointerMove = pointer => {
    items.forEach(item => {
      const rect = item.getBoundingClientRect();
      const centerX = rect.x + rect.width / 2;
      const centerY = rect.y + rect.height / 2;
      const b = pointer.x - centerX;
      const a = pointer.y - centerY;
      const c = Math.sqrt(a * a + b * b) || 1;
      const r = ((Math.acos(b / c) * 180) / Math.PI) * (pointer.y > centerY ? 1 : -1);
      item.style.setProperty('--rotate', `${r}deg`);
    });
  };

  // Initial static frame: point every line at the middle one (as the source does).
  if (items.length) {
    const rect = items[Math.floor(items.length / 2)].getBoundingClientRect();
    onPointerMove({ x: rect.x, y: rect.y });
  }

  if (!reduced) window.addEventListener('pointermove', onPointerMove);

  return {
    destroy() {
      window.removeEventListener('pointermove', onPointerMove);
      items.forEach(s => s.remove());
      container.classList.remove('magnetLines-container');
      for (const p of ['grid-template-columns', 'grid-template-rows', 'width', 'height'])
        container.style.removeProperty(p);
    }
  };
}
