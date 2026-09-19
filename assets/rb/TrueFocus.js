// Port of React Bits TrueFocus. Frame movement uses window.gsap.
const CSS = `
.rb-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;white-space:nowrap}
.rb-focus{position:relative;display:flex;gap:1em;justify-content:center;align-items:center;flex-wrap:wrap;outline:none;user-select:none}
.rb-focus-word{position:relative;cursor:pointer;outline:none;user-select:none}
.rb-focus-frame{position:absolute;top:0;left:0;pointer-events:none;box-sizing:content-box;border:none;opacity:0}
.rb-focus-corner{position:absolute;width:1rem;height:1rem;border:3px solid var(--border-color,#fff);filter:drop-shadow(0 0 4px var(--border-color,#fff));border-radius:3px}
.rb-focus-corner.tl{top:-10px;left:-10px;border-right:none;border-bottom:none}
.rb-focus-corner.tr{top:-10px;right:-10px;border-left:none;border-bottom:none}
.rb-focus-corner.bl{bottom:-10px;left:-10px;border-right:none;border-top:none}
.rb-focus-corner.br{bottom:-10px;right:-10px;border-left:none;border-top:none}`;

const DEFAULTS = {
  separator: ' ',
  manualMode: false,
  blurAmount: 5,
  borderColor: 'green',
  glowColor: 'rgba(0, 255, 0, 0.6)',
  animationDuration: 0.5,
  pauseBetweenAnimations: 1
};

export default function mount(el, opts = {}) {
  const o = { text: el.textContent, ...DEFAULTS, ...opts };
  const sentence = o.sentence ?? o.text; // React prop is `sentence`
  const words = sentence.split(o.separator);

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = sentence;
    return { destroy() {}, play() {} };
  }

  if (!document.querySelector('style[data-rb="TrueFocus"]')) {
    const s = document.createElement('style');
    s.dataset.rb = 'TrueFocus';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  const gsap = window.gsap;
  el.classList.add('rb-focus');
  el.style.setProperty('--border-color', o.borderColor);
  el.style.setProperty('--glow-color', o.glowColor);
  el.textContent = '';

  const sr = document.createElement('span');
  sr.className = 'rb-sr';
  sr.textContent = sentence;
  el.appendChild(sr);

  const spans = words.map(w => {
    const s = document.createElement('span');
    s.className = 'rb-focus-word';
    s.setAttribute('aria-hidden', 'true');
    s.textContent = w;
    s.style.transition = `filter ${o.animationDuration}s ease`;
    el.appendChild(s);
    return s;
  });

  const frame = document.createElement('div');
  frame.className = 'rb-focus-frame';
  frame.setAttribute('aria-hidden', 'true');
  for (const c of ['tl', 'tr', 'bl', 'br']) {
    const s = document.createElement('span');
    s.className = `rb-focus-corner ${c}`;
    frame.appendChild(s);
  }
  el.appendChild(frame);

  let current = 0;
  let lastActive = 0;
  let timer = null;

  function setIndex(i, instant = false) {
    current = i;
    spans.forEach((s, j) => (s.style.filter = j === i ? 'blur(0px)' : `blur(${o.blurAmount}px)`));
    const p = el.getBoundingClientRect();
    const r = spans[i].getBoundingClientRect();
    gsap.to(frame, {
      x: r.left - p.left,
      y: r.top - p.top,
      width: r.width,
      height: r.height,
      opacity: 1,
      duration: instant ? 0 : o.animationDuration,
      overwrite: true
    });
  }
  const next = () => setIndex((current + 1) % words.length);

  function startAuto() {
    clearInterval(timer);
    if (!o.manualMode) timer = setInterval(next, (o.animationDuration + o.pauseBetweenAnimations) * 1000);
  }

  const enters = spans.map((s, i) => {
    const h = () => {
      lastActive = i;
      setIndex(i);
    };
    if (o.manualMode) s.addEventListener('pointerenter', h);
    return h;
  });
  const onLeave = () => setIndex(lastActive);
  if (o.manualMode) el.addEventListener('pointerleave', onLeave);

  const onResize = () => setIndex(current, true);
  addEventListener('resize', onResize);

  setIndex(0, true);
  startAuto();

  return {
    play() {
      next();
      startAuto();
    },
    destroy() {
      clearInterval(timer);
      removeEventListener('resize', onResize);
      el.removeEventListener('pointerleave', onLeave);
      spans.forEach((s, i) => s.removeEventListener('pointerenter', enters[i]));
      gsap.killTweensOf(frame);
      el.classList.remove('rb-focus');
      el.style.removeProperty('--border-color');
      el.style.removeProperty('--glow-color');
      el.textContent = sentence;
    }
  };
}
