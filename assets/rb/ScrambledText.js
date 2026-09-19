// Port of React Bits ScrambledText. Needs window.gsap + SplitText (registered).
// ScrambleTextPlugin is not loaded on this site, so the per-char scramble is done by hand.
const CSS = `
.rb-scramble{display:inline-block}
.rb-scramble-char{will-change:transform;display:inline-block}`;

const DEFAULTS = {
  radius: 100,
  duration: 1.2,
  speed: 0.5,
  scrambleChars: '.:'
};

export default function mount(el, opts = {}) {
  const o = { text: el.textContent, ...DEFAULTS, ...opts };
  const text = o.text;
  el.textContent = text;

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return { destroy() {}, play() {} };
  }

  if (!document.querySelector('style[data-rb="ScrambledText"]')) {
    const s = document.createElement('style');
    s.dataset.rb = 'ScrambledText';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  const gsap = window.gsap;
  el.classList.add('rb-scramble');
  // SplitText (aria:'auto' default) puts aria-label=text on el and aria-hidden on chars.
  const split = (window.SplitText || gsap.SplitText).create(el, { type: 'chars', charsClass: 'rb-scramble-char' });
  const chars = split.chars;
  chars.forEach(c => (c.dataset.content = c.textContent));

  const rnd = () => o.scrambleChars.charAt(Math.floor(Math.random() * o.scrambleChars.length)) || '';

  // ponytail: hand-rolled ScrambleTextPlugin; swap for gsap ScrambleTextPlugin if it gets loaded.
  function scramble(c, dur) {
    const st = c._rbScramble || (c._rbScramble = { p: 0, last: -1 });
    st.p = 0;
    st.last = -1;
    gsap.to(st, {
      p: 1,
      duration: dur,
      ease: 'none',
      overwrite: true,
      onUpdate() {
        const step = Math.floor(this.time() * o.speed * 20);
        if (step !== st.last) {
          st.last = step;
          c.textContent = rnd();
        }
      },
      onComplete() {
        c.textContent = c.dataset.content;
      }
    });
  }

  const onMove = e => {
    for (const c of chars) {
      const { left, top, width, height } = c.getBoundingClientRect();
      const dist = Math.hypot(e.clientX - (left + width / 2), e.clientY - (top + height / 2));
      if (dist < o.radius) scramble(c, o.duration * (1 - dist / o.radius));
    }
  };
  el.addEventListener('pointermove', onMove);

  return {
    play() {
      chars.forEach(c => scramble(c, o.duration));
    },
    destroy() {
      el.removeEventListener('pointermove', onMove);
      chars.forEach(c => c._rbScramble && gsap.killTweensOf(c._rbScramble));
      split.revert();
      el.classList.remove('rb-scramble');
      el.textContent = text;
    }
  };
}
