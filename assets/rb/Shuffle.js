// Port of React Bits Shuffle. Needs window.gsap with SplitText + ScrollTrigger registered.
const CSS = `
.rb-shuffle{display:inline-block;white-space:normal;word-wrap:break-word;will-change:transform;line-height:1;visibility:hidden}
.rb-shuffle.is-ready{visibility:visible}
.rb-shuffle-char{line-height:1;display:inline-block;text-align:center}`;

const DEFAULTS = {
  shuffleDirection: 'right', // 'left' | 'right' | 'up' | 'down'
  duration: 0.35,
  maxDelay: 0,
  ease: 'power3.out',
  threshold: 0.1,
  rootMargin: '-100px',
  textAlign: 'center',
  onShuffleComplete: null,
  shuffleTimes: 1,
  animationMode: 'evenodd', // 'evenodd' | 'random'
  loop: false,
  loopDelay: 0,
  stagger: 0.03,
  scrambleCharset: '',
  colorFrom: undefined,
  colorTo: undefined,
  triggerOnce: true,
  respectReducedMotion: true,
  triggerOnHover: true
};

export default function mount(el, opts = {}) {
  const o = { text: el.textContent, ...DEFAULTS, ...opts };
  const text = o.text;
  el.textContent = text;
  el.style.textAlign = o.textAlign;

  if (!document.querySelector('style[data-rb="Shuffle"]')) {
    const s = document.createElement('style');
    s.dataset.rb = 'Shuffle';
    s.textContent = CSS;
    document.head.appendChild(s);
  }
  el.classList.add('rb-shuffle');

  if (o.respectReducedMotion && matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.classList.add('is-ready');
    o.onShuffleComplete?.();
    return { destroy() { el.classList.remove('rb-shuffle', 'is-ready'); }, play() {} };
  }

  const gsap = window.gsap;
  const isVertical = o.shuffleDirection === 'up' || o.shuffleDirection === 'down';
  const rolls = Math.max(1, Math.floor(o.shuffleTimes));
  const rand = set => set.charAt(Math.floor(Math.random() * set.length)) || '';

  let split = null;
  let wrappers = [];
  let tl = null;
  let playing = false;
  let st = null;
  let dead = false;

  const scrollStart = (() => {
    const startPct = (1 - o.threshold) * 100;
    const mm = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(o.rootMargin || '');
    const mv = mm ? parseFloat(mm[1]) : 0;
    const mu = mm ? mm[2] || 'px' : 'px';
    const sign = mv === 0 ? '' : mv < 0 ? `-=${Math.abs(mv)}${mu}` : `+=${mv}${mu}`;
    return `top ${startPct}%${sign}`;
  })();

  function teardown() {
    tl?.kill();
    tl = null;
    for (const wrap of wrappers) {
      const orig = wrap.firstElementChild?.querySelector('[data-orig="1"]');
      if (orig && wrap.parentNode) wrap.parentNode.replaceChild(orig, wrap);
    }
    wrappers = [];
    try { split?.revert(); } catch { /* noop */ }
    split = null;
    playing = false;
  }

  const metricsCtx = isVertical ? document.createElement('canvas').getContext('2d') : null;
  function measureVerticalCell(node, lineBoxHeight) {
    const cs = getComputedStyle(node);
    let fontHeight = 0;
    if (metricsCtx) {
      metricsCtx.font = [cs.fontStyle, cs.fontVariant, cs.fontWeight, cs.fontSize, cs.fontFamily].join(' ');
      const m = metricsCtx.measureText(`${node.textContent || 'M'}${o.scrambleCharset}`);
      if (Number.isFinite(m.fontBoundingBoxAscent) && Number.isFinite(m.fontBoundingBoxDescent))
        fontHeight = m.fontBoundingBoxAscent + m.fontBoundingBoxDescent;
    }
    if (!fontHeight) {
      const probe = node.cloneNode(true);
      probe.textContent = `${node.textContent || 'M'}${o.scrambleCharset}`;
      Object.assign(probe.style, {
        position: 'absolute', visibility: 'hidden', pointerEvents: 'none', width: 'auto', height: 'auto',
        whiteSpace: 'nowrap', lineHeight: 'normal', fontFamily: cs.fontFamily, fontSize: cs.fontSize,
        fontStyle: cs.fontStyle, fontVariant: cs.fontVariant, fontWeight: cs.fontWeight, fontStretch: cs.fontStretch
      });
      document.body.appendChild(probe);
      fontHeight = probe.getBoundingClientRect().height;
      probe.remove();
    }
    const overflow = Math.max(0, Math.ceil(fontHeight - lineBoxHeight));
    const padTop = Math.floor(overflow / 2);
    return { cellHeight: lineBoxHeight + overflow, padTop, padBottom: overflow - padTop };
  }

  function build() {
    teardown();
    // SplitText aria:'auto' keeps the full text as aria-label on el.
    split = new (window.SplitText || gsap.SplitText)(el, {
      type: 'chars',
      charsClass: 'rb-shuffle-char',
      wordsClass: 'rb-shuffle-word',
      linesClass: 'rb-shuffle-line',
      smartWrap: true,
      reduceWhiteSpace: false
    });

    for (const ch of split.chars || []) {
      const parent = ch.parentElement;
      if (!parent) continue;
      const { width: w, height: h } = ch.getBoundingClientRect();
      if (!w) continue;
      const { cellHeight, padTop, padBottom } = isVertical ? measureVerticalCell(ch, h) : { cellHeight: h, padTop: 0, padBottom: 0 };

      const wrap = document.createElement('span');
      Object.assign(wrap.style, {
        display: 'inline-block', overflow: 'hidden', width: w + 'px',
        height: isVertical ? cellHeight + 'px' : 'auto',
        marginTop: isVertical ? -padTop + 'px' : '0',
        marginBottom: isVertical ? -padBottom + 'px' : '0',
        verticalAlign: 'bottom'
      });
      const inner = document.createElement('span');
      Object.assign(inner.style, { display: 'inline-block', whiteSpace: isVertical ? 'normal' : 'nowrap', willChange: 'transform' });
      parent.insertBefore(wrap, ch);
      wrap.appendChild(inner);

      const cellStyle = {
        display: isVertical ? 'flex' : 'inline-block',
        alignItems: isVertical ? 'center' : '',
        justifyContent: isVertical ? 'center' : '',
        height: isVertical ? cellHeight + 'px' : '',
        lineHeight: isVertical ? h + 'px' : '',
        width: w + 'px',
        textAlign: 'center'
      };
      const firstOrig = ch.cloneNode(true);
      Object.assign(firstOrig.style, cellStyle);
      ch.setAttribute('data-orig', '1');
      Object.assign(ch.style, cellStyle);

      inner.appendChild(firstOrig);
      for (let k = 0; k < rolls; k++) {
        const c = ch.cloneNode(true);
        if (o.scrambleCharset) c.textContent = rand(o.scrambleCharset);
        Object.assign(c.style, cellStyle);
        inner.appendChild(c);
      }
      inner.appendChild(ch);

      const steps = rolls + 1;
      if (o.shuffleDirection === 'right' || o.shuffleDirection === 'down') {
        const firstCopy = inner.firstElementChild;
        const real = inner.lastElementChild;
        if (real) inner.insertBefore(real, inner.firstChild);
        if (firstCopy) inner.appendChild(firstCopy);
      }

      let startX = 0, finalX = 0, startY = 0, finalY = 0;
      if (o.shuffleDirection === 'right') startX = -steps * w;
      else if (o.shuffleDirection === 'left') finalX = -steps * w;
      else if (o.shuffleDirection === 'down') startY = -steps * cellHeight;
      else if (o.shuffleDirection === 'up') finalY = -steps * cellHeight;

      if (isVertical) {
        gsap.set(inner, { x: 0, y: startY, force3D: true });
        inner.dataset.startY = startY;
        inner.dataset.finalY = finalY;
      } else {
        gsap.set(inner, { x: startX, y: 0, force3D: true });
        inner.dataset.startX = startX;
        inner.dataset.finalX = finalX;
      }
      if (o.colorFrom) inner.style.color = o.colorFrom;
      wrappers.push(wrap);
    }
  }

  const inners = () => wrappers.map(w => w.firstElementChild);

  function randomizeScrambles() {
    if (!o.scrambleCharset) return;
    for (const strip of inners()) {
      const kids = Array.from(strip.children);
      for (let i = 1; i < kids.length - 1; i++) kids[i].textContent = rand(o.scrambleCharset);
    }
  }

  function cleanupToStill() {
    for (const strip of inners()) {
      const real = strip.querySelector('[data-orig="1"]');
      if (!real) continue;
      strip.replaceChildren(real);
      strip.style.transform = 'none';
      strip.style.willChange = 'auto';
    }
  }

  function play() {
    const strips = inners();
    if (!strips.length) return;
    playing = true;
    const startKey = isVertical ? 'startY' : 'startX';
    const finalKey = isVertical ? 'finalY' : 'finalX';
    const axis = isVertical ? 'y' : 'x';

    tl = gsap.timeline({
      smoothChildTiming: true,
      repeat: o.loop ? -1 : 0,
      repeatDelay: o.loop ? o.loopDelay : 0,
      onRepeat() {
        randomizeScrambles();
        gsap.set(strips, { [axis]: (i, t) => parseFloat(t.dataset[startKey] || '0') });
        o.onShuffleComplete?.();
      },
      onComplete() {
        playing = false;
        if (!o.loop) {
          cleanupToStill();
          if (o.colorTo) gsap.set(strips, { color: o.colorTo });
          o.onShuffleComplete?.();
          armHover();
        }
      }
    });

    const addTween = (targets, at) => {
      tl.to(targets, {
        duration: o.duration, ease: o.ease, force3D: true,
        stagger: o.animationMode === 'evenodd' ? o.stagger : 0,
        [axis]: (i, t) => parseFloat(t.dataset[finalKey] || '0')
      }, at);
      if (o.colorFrom && o.colorTo) tl.to(targets, { color: o.colorTo, duration: o.duration, ease: o.ease }, at);
    };

    if (o.animationMode === 'evenodd') {
      const odd = strips.filter((_, i) => i % 2 === 1);
      const even = strips.filter((_, i) => i % 2 === 0);
      const oddTotal = o.duration + Math.max(0, odd.length - 1) * o.stagger;
      const evenStart = odd.length ? oddTotal * 0.7 : 0;
      if (odd.length) addTween(odd, 0);
      if (even.length) addTween(even, evenStart);
    } else {
      for (const strip of strips) {
        const d = Math.random() * o.maxDelay;
        tl.to(strip, { duration: o.duration, ease: o.ease, force3D: true, [axis]: parseFloat(strip.dataset[finalKey] || '0') }, d);
        if (o.colorFrom && o.colorTo) tl.fromTo(strip, { color: o.colorFrom }, { color: o.colorTo, duration: o.duration, ease: o.ease }, d);
      }
    }
  }

  const run = () => {
    if (playing) return;
    build();
    randomizeScrambles();
    play();
  };
  const onHover = run;
  function armHover() {
    if (!o.triggerOnHover) return;
    el.removeEventListener('mouseenter', onHover);
    el.addEventListener('mouseenter', onHover);
  }

  (document.fonts?.ready ?? Promise.resolve()).then(() => {
    if (dead) return;
    st = (window.ScrollTrigger || gsap.ScrollTrigger).create({
      trigger: el,
      start: scrollStart,
      once: o.triggerOnce,
      onEnter() {
        run();
        armHover();
        el.classList.add('is-ready');
      }
    });
  });

  return {
    play() {
      el.classList.add('is-ready');
      run();
    },
    destroy() {
      dead = true;
      st?.kill();
      el.removeEventListener('mouseenter', onHover);
      teardown();
      el.classList.remove('rb-shuffle', 'is-ready');
      el.style.removeProperty('text-align');
      el.textContent = text;
    }
  };
}
