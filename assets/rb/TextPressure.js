// Port of React Bits TextPressure (variable-font weight/width/italic follow the pointer).
// Needs a variable font with wght/wdth/ital axes; default loads Roboto Flex. Pass fontFamily:'inherit' to keep el's font
// (the effect then only works if that font is variable).
const CSS = `
.rb-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;white-space:nowrap}
.rb-tp{text-transform:uppercase;margin:0;text-align:center;user-select:none;white-space:nowrap;font-weight:100;width:100%;transform-origin:center top;color:var(--rb-tp-color)}
.rb-tp>span{display:inline-block}
.rb-tp.flex{display:flex;justify-content:space-between}
.rb-tp.stroke>span{position:relative;color:var(--rb-tp-color)}
.rb-tp.stroke>span::after{content:attr(data-char);position:absolute;left:0;top:0;color:transparent;z-index:-1;-webkit-text-stroke-width:3px;-webkit-text-stroke-color:var(--rb-tp-stroke)}`;

const DEFAULTS = {
  fontFamily: 'Roboto Flex',
  fontUrl: 'https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&display=swap',
  width: true,
  weight: true,
  italic: true,
  alpha: false,
  flex: true,
  stroke: false,
  scale: false,
  textColor: '#FFFFFF',
  strokeColor: '#FF0000',
  minFontSize: 24
};

const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
const getAttr = (d, maxDist, minVal, maxVal) => Math.max(minVal, maxVal - Math.abs((maxVal * d) / maxDist) + minVal);

export default function mount(el, opts = {}) {
  const o = { text: el.textContent, ...DEFAULTS, ...opts };
  const text = o.text;
  const chars = text.split('');

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = text;
    return { destroy() {}, play() {} };
  }

  if (!document.querySelector('style[data-rb="TextPressure"]')) {
    const s = document.createElement('style');
    s.dataset.rb = 'TextPressure';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
  if (o.fontUrl && !document.querySelector(`link[href="${o.fontUrl}"]`)) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = o.fontUrl;
    document.head.appendChild(l);
  }

  el.classList.add('rb-tp');
  el.classList.toggle('flex', !!o.flex);
  el.classList.toggle('stroke', !!o.stroke);
  if (o.fontFamily !== 'inherit') el.style.fontFamily = o.fontFamily;
  el.style.setProperty('--rb-tp-color', o.textColor);
  el.style.setProperty('--rb-tp-stroke', o.strokeColor);
  el.textContent = '';

  const sr = document.createElement('span');
  sr.className = 'rb-sr';
  sr.textContent = text;
  el.appendChild(sr);
  const spans = chars.map(ch => {
    const s = document.createElement('span');
    s.dataset.char = ch;
    s.setAttribute('aria-hidden', 'true');
    s.textContent = ch;
    el.appendChild(s);
    return s;
  });

  const container = el.parentElement || el;
  const mouse = { x: 0, y: 0 };
  const cursor = { x: 0, y: 0 };
  {
    const r = container.getBoundingClientRect();
    mouse.x = cursor.x = r.left + r.width / 2;
    mouse.y = cursor.y = r.top + r.height / 2;
  }
  const onMouse = e => { cursor.x = e.clientX; cursor.y = e.clientY; };
  const onTouch = e => { cursor.x = e.touches[0].clientX; cursor.y = e.touches[0].clientY; };
  addEventListener('mousemove', onMouse);
  addEventListener('touchmove', onTouch, { passive: true });

  function setSize() {
    const { width: cw, height: ch } = container.getBoundingClientRect();
    el.style.fontSize = Math.max(cw / (chars.length / 2), o.minFontSize) + 'px';
    el.style.lineHeight = '1';
    el.style.transform = 'scale(1, 1)';
    requestAnimationFrame(() => {
      const h = el.getBoundingClientRect().height;
      if (o.scale && h > 0) {
        const y = ch / h;
        el.style.lineHeight = String(y);
        el.style.transform = `scale(1, ${y})`;
      }
    });
  }
  let resizeT = 0;
  const onResize = () => { clearTimeout(resizeT); resizeT = setTimeout(setSize, 100); };
  addEventListener('resize', onResize);
  onResize();

  let raf = 0;
  const animate = () => {
    mouse.x += (cursor.x - mouse.x) / 15;
    mouse.y += (cursor.y - mouse.y) / 15;
    const maxDist = el.getBoundingClientRect().width / 2;
    for (const span of spans) {
      const r = span.getBoundingClientRect();
      const d = dist(mouse, { x: r.x + r.width / 2, y: r.y + r.height / 2 });
      const wdth = o.width ? Math.floor(getAttr(d, maxDist, 5, 200)) : 100;
      const wght = o.weight ? Math.floor(getAttr(d, maxDist, 100, 900)) : 400;
      const ital = o.italic ? getAttr(d, maxDist, 0, 1).toFixed(2) : 0;
      const fvs = `'wght' ${wght}, 'wdth' ${wdth}, 'ital' ${ital}`;
      if (span.style.fontVariationSettings !== fvs) span.style.fontVariationSettings = fvs;
      if (o.alpha) {
        const a = getAttr(d, maxDist, 0, 1).toFixed(2);
        if (span.style.opacity !== a) span.style.opacity = a;
      }
    }
    raf = requestAnimationFrame(animate);
  };
  animate();

  return {
    // Effect is pointer-driven; play() re-measures and snaps the attractor back to center.
    play() {
      setSize();
      const r = container.getBoundingClientRect();
      cursor.x = r.left + r.width / 2;
      cursor.y = r.top + r.height / 2;
    },
    destroy() {
      cancelAnimationFrame(raf);
      clearTimeout(resizeT);
      removeEventListener('mousemove', onMouse);
      removeEventListener('touchmove', onTouch);
      removeEventListener('resize', onResize);
      el.classList.remove('rb-tp', 'flex', 'stroke');
      for (const p of ['font-family', 'font-size', 'line-height', 'transform', '--rb-tp-color', '--rb-tp-stroke'])
        el.style.removeProperty(p);
      el.textContent = text;
    }
  };
}
