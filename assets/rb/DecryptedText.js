// Port of React Bits DecryptedText (vanilla ES module, no deps).
const CSS = `
.rb-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;white-space:nowrap}
.rb-decrypt{display:inline-block;white-space:pre-wrap}`;

const DEFAULTS = {
  speed: 50,
  maxIterations: 10,
  sequential: false,
  revealDirection: 'start', // 'start' | 'end' | 'center'
  useOriginalCharsOnly: false,
  characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+',
  className: '',
  encryptedClassName: '',
  animateOn: 'hover', // 'hover' | 'view' | 'click' | 'inViewHover' | 'load'
  clickMode: 'once' // 'once' | 'toggle'
};

export default function mount(el, opts = {}) {
  const o = { text: el.textContent, ...DEFAULTS, ...opts };
  const text = o.text;
  const len = text.length;

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = text;
    return { destroy() {}, play() {} };
  }

  if (!document.querySelector('style[data-rb="DecryptedText"]')) {
    const s = document.createElement('style');
    s.dataset.rb = 'DecryptedText';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  el.classList.add('rb-decrypt');
  el.textContent = '';
  const sr = document.createElement('span');
  sr.className = 'rb-sr';
  sr.textContent = text;
  const vis = document.createElement('span');
  vis.setAttribute('aria-hidden', 'true');
  const spans = Array.from(text, ch => {
    const s = document.createElement('span');
    s.textContent = ch;
    vis.appendChild(s);
    return s;
  });
  el.append(sr, vis);

  const pool = o.useOriginalCharsOnly ? [...new Set(text)].filter(c => c !== ' ') : o.characters.split('');
  let revealed = new Set();
  let animating = false;
  let decrypted = o.animateOn !== 'click';
  let direction = 'forward';
  let timer = null;
  let order = [];
  let ptr = 0;
  let iter = 0;

  const rnd = () => pool[Math.floor(Math.random() * pool.length)] ?? '';
  const shuffle = () => Array.from(text, (c, i) => (c === ' ' ? ' ' : revealed.has(i) ? c : rnd())).join('');
  const all = () => new Set(Array.from({ length: len }, (_, i) => i));

  function computeOrder() {
    const out = [];
    if (o.revealDirection === 'start') for (let i = 0; i < len; i++) out.push(i);
    else if (o.revealDirection === 'end') for (let i = len - 1; i >= 0; i--) out.push(i);
    else {
      const mid = Math.floor(len / 2);
      for (let off = 0; out.length < len; off++) {
        const idx = off % 2 === 0 ? mid + off / 2 : mid - Math.ceil(off / 2);
        if (idx >= 0 && idx < len) out.push(idx);
      }
    }
    return out;
  }

  function render(display) {
    const done = !animating && decrypted;
    spans.forEach((s, i) => {
      s.textContent = display[i];
      s.className = done || revealed.has(i) ? o.className : o.encryptedClassName;
    });
  }

  function stop(dec) {
    clearInterval(timer);
    timer = null;
    animating = false;
    decrypted = dec;
    render(dec ? text : shuffle());
  }

  function tick() {
    if (o.sequential) {
      if (ptr < order.length) {
        const i = order[ptr++];
        direction === 'forward' ? revealed.add(i) : revealed.delete(i);
        render(shuffle());
        if (ptr < order.length) return;
      }
      stop(direction === 'forward');
    } else if (direction === 'forward') {
      render(shuffle());
      if (++iter >= o.maxIterations) stop(true);
    } else {
      if (!revealed.size) revealed = all();
      const arr = [...revealed];
      const n = Math.max(1, Math.ceil(len / Math.max(1, o.maxIterations)));
      for (let i = 0; i < n && arr.length; i++) arr.splice(Math.floor(Math.random() * arr.length), 1);
      revealed = new Set(arr);
      render(shuffle());
      if (!revealed.size || ++iter >= o.maxIterations) {
        revealed = new Set();
        stop(false);
      }
    }
  }

  function start(dir) {
    clearInterval(timer);
    direction = dir;
    iter = 0;
    ptr = 0;
    if (dir === 'forward') {
      revealed = new Set();
      order = o.sequential ? computeOrder() : [];
    } else {
      revealed = all();
      order = computeOrder().reverse();
    }
    animating = true;
    render(shuffle());
    timer = setInterval(tick, o.speed);
  }

  function resetToPlain() {
    clearInterval(timer);
    timer = null;
    animating = false;
    revealed = new Set();
    decrypted = true;
    direction = 'forward';
    render(text);
  }

  // handlers
  const onEnter = () => {
    if (!animating) start('forward');
  };
  const onLeave = resetToPlain;
  const onClick = () => {
    if (o.clickMode === 'toggle') return decrypted ? start('reverse') : start('forward');
    if (!decrypted) start('forward');
  };
  let io = null;

  const mode = o.animateOn;
  if (mode === 'hover' || mode === 'inViewHover') {
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);
  }
  if (mode === 'click') el.addEventListener('click', onClick);
  if (mode === 'view' || mode === 'inViewHover') {
    io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        start('forward');
        io.disconnect();
        io = null;
      }
    }, { threshold: 0.1 });
    io.observe(el);
  }

  // initial state
  if (mode === 'click') {
    revealed = new Set();
    decrypted = false;
    render(shuffle());
  } else render(text);
  if (mode === 'load') start('forward');

  return {
    play() {
      start('forward');
    },
    destroy() {
      clearInterval(timer);
      io?.disconnect();
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('click', onClick);
      el.classList.remove('rb-decrypt');
      el.textContent = text;
    }
  };
}
