// Port of React Bits FuzzyText. Renders el's text into a <canvas>; plain text kept in a visually-hidden span.
const CSS = `
.rb-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0;white-space:nowrap}
.rb-fuzzy{position:relative;display:inline-block}
.rb-fuzzy canvas{display:block}`;

const DEFAULTS = {
  fontSize: 'clamp(2rem, 8vw, 8rem)', // number (px) | css length | 'inherit' (el's computed size)
  fontWeight: 900,
  fontFamily: 'inherit',
  color: '#fff',
  enableHover: true,
  baseIntensity: 0.18,
  hoverIntensity: 0.5,
  fuzzRange: 30,
  fps: 60,
  direction: 'horizontal', // 'horizontal' | 'vertical' | 'both'
  transitionDuration: 0,
  clickEffect: false,
  glitchMode: false,
  glitchInterval: 2000,
  glitchDuration: 200,
  gradient: null,
  letterSpacing: 0
};

export default function mount(el, opts = {}) {
  const o = { text: el.textContent, ...DEFAULTS, ...opts };
  const text = o.text;

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = text;
    return { destroy() {}, play() {} };
  }

  if (!document.querySelector('style[data-rb="FuzzyText"]')) {
    const s = document.createElement('style');
    s.dataset.rb = 'FuzzyText';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  el.classList.add('rb-fuzzy');
  el.textContent = '';
  const sr = document.createElement('span');
  sr.className = 'rb-sr';
  sr.textContent = text;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  el.append(sr, canvas);

  let raf = 0;
  let cancelled = false;
  let glitchT = 0, glitchEndT = 0, clickT = 0;
  let isHovering = false, isClicking = false, isGlitching = false;
  const listeners = [];
  const on = (ev, fn, opt) => { canvas.addEventListener(ev, fn, opt); listeners.push([ev, fn]); };

  async function init() {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cs = getComputedStyle(el);
    const family = o.fontFamily === 'inherit' ? cs.fontFamily || 'sans-serif' : o.fontFamily;
    let sizeStr = typeof o.fontSize === 'number' ? `${o.fontSize}px` : o.fontSize;
    if (sizeStr === 'inherit') sizeStr = cs.fontSize;
    const font = `${o.fontWeight} ${sizeStr} ${family}`;

    try { await document.fonts.load(font); } catch { await document.fonts.ready; }
    if (cancelled) return;

    let numericSize;
    if (typeof o.fontSize === 'number') numericSize = o.fontSize;
    else {
      const tmp = document.createElement('span');
      tmp.style.fontSize = sizeStr;
      document.body.appendChild(tmp);
      numericSize = parseFloat(getComputedStyle(tmp).fontSize);
      tmp.remove();
    }

    const off = document.createElement('canvas');
    const offCtx = off.getContext('2d');
    if (!offCtx) return;
    offCtx.font = font;
    offCtx.textBaseline = 'alphabetic';

    const ls = o.letterSpacing;
    let totalWidth = 0;
    if (ls !== 0) {
      for (const ch of text) totalWidth += offCtx.measureText(ch).width + ls;
      totalWidth -= ls;
    } else totalWidth = offCtx.measureText(text).width;

    const m = offCtx.measureText(text);
    const actualLeft = m.actualBoundingBoxLeft ?? 0;
    const actualRight = ls !== 0 ? totalWidth : (m.actualBoundingBoxRight ?? m.width);
    const ascent = m.actualBoundingBoxAscent ?? numericSize;
    const descent = m.actualBoundingBoxDescent ?? numericSize * 0.2;
    const textW = Math.ceil(ls !== 0 ? totalWidth : actualLeft + actualRight);
    const tightH = Math.ceil(ascent + descent);
    const buf = 10;
    const offW = textW + buf;
    off.width = offW;
    off.height = tightH;
    const xOff = buf / 2;
    offCtx.font = font;
    offCtx.textBaseline = 'alphabetic';

    if (Array.isArray(o.gradient) && o.gradient.length >= 2) {
      const g = offCtx.createLinearGradient(0, 0, offW, 0);
      o.gradient.forEach((c, i) => g.addColorStop(i / (o.gradient.length - 1), c));
      offCtx.fillStyle = g;
    } else offCtx.fillStyle = o.color;

    if (ls !== 0) {
      let x = xOff;
      for (const ch of text) {
        offCtx.fillText(ch, x, ascent);
        x += offCtx.measureText(ch).width + ls;
      }
    } else offCtx.fillText(text, xOff - actualLeft, ascent);

    const fz = o.fuzzRange;
    const hm = fz + 20;
    canvas.width = offW + hm * 2;
    canvas.height = tightH;
    ctx.translate(hm, 0);

    const iLeft = hm + xOff, iTop = 0, iRight = iLeft + textW, iBottom = tightH;
    const inside = (x, y) => x >= iLeft && x <= iRight && y >= iTop && y <= iBottom;

    let cur = o.baseIntensity, target = o.baseIntensity, last = 0;
    const frameDur = 1000 / o.fps;

    const glitchLoop = () => {
      if (!o.glitchMode || cancelled) return;
      glitchT = setTimeout(() => {
        if (cancelled) return;
        isGlitching = true;
        glitchEndT = setTimeout(() => { isGlitching = false; glitchLoop(); }, o.glitchDuration);
      }, o.glitchInterval);
    };
    if (o.glitchMode) glitchLoop();

    const clear = () => ctx.clearRect(-fz - 20, -fz - 10, offW + 2 * (fz + 20), tightH + 2 * (fz + 10));

    const run = ts => {
      if (cancelled) return;
      if (ts - last < frameDur) { raf = requestAnimationFrame(run); return; }
      last = ts;
      clear();
      target = isClicking || isGlitching ? 1 : isHovering ? o.hoverIntensity : o.baseIntensity;
      if (o.transitionDuration > 0) {
        const step = 1 / (o.transitionDuration / frameDur);
        if (cur < target) cur = Math.min(cur + step, target);
        else if (cur > target) cur = Math.max(cur - step, target);
      } else cur = target;

      if (o.direction === 'horizontal') {
        for (let j = 0; j < tightH; j++) {
          const dx = Math.floor(cur * (Math.random() - 0.5) * fz);
          ctx.drawImage(off, 0, j, offW, 1, dx, j, offW, 1);
        }
      } else if (o.direction === 'vertical') {
        for (let i = 0; i < offW; i++) {
          const dy = Math.floor(cur * (Math.random() - 0.5) * fz);
          ctx.drawImage(off, i, 0, 1, tightH, i, dy, 1, tightH);
        }
      } else {
        for (let j = 0; j < tightH; j++) {
          const dx = Math.floor(cur * (Math.random() - 0.5) * fz);
          ctx.drawImage(off, 0, j, offW, 1, dx, j, offW, 1);
        }
        const tmp = ctx.getImageData(0, 0, offW + fz, tightH + fz);
        clear();
        ctx.putImageData(tmp, 0, 0);
        for (let i = 0; i < offW + fz; i++) {
          const dy = Math.floor(cur * (Math.random() - 0.5) * fz * 0.5);
          const col = ctx.getImageData(i, 0, 1, tightH + fz);
          ctx.clearRect(i, -fz, 1, tightH + 2 * fz);
          ctx.putImageData(col, i, dy);
        }
      }
      raf = requestAnimationFrame(run);
    };
    raf = requestAnimationFrame(run);

    if (o.enableHover) {
      const pos = (cx, cy) => { const r = canvas.getBoundingClientRect(); isHovering = inside(cx - r.left, cy - r.top); };
      on('mousemove', e => pos(e.clientX, e.clientY));
      on('mouseleave', () => (isHovering = false));
      on('touchmove', e => { e.preventDefault(); pos(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
      on('touchend', () => (isHovering = false));
    }
    if (o.clickEffect) {
      on('click', () => {
        isClicking = true;
        clearTimeout(clickT);
        clickT = setTimeout(() => (isClicking = false), 150);
      });
    }
  }
  init();

  let playT = 0;
  return {
    // One burst at full intensity (same as a glitchMode tick).
    play() {
      isGlitching = true;
      clearTimeout(playT);
      playT = setTimeout(() => (isGlitching = false), o.glitchDuration);
    },
    destroy() {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(glitchT); clearTimeout(glitchEndT); clearTimeout(clickT); clearTimeout(playT);
      for (const [ev, fn] of listeners) canvas.removeEventListener(ev, fn);
      el.classList.remove('rb-fuzzy');
      el.textContent = text;
    }
  };
}
