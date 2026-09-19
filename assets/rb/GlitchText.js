// Port of React Bits GlitchText. Pure CSS effect driven by data-text + custom properties.
const CSS = `
.rb-glitch{position:relative;white-space:nowrap;user-select:none;cursor:pointer}
.rb-glitch::before,.rb-glitch::after{content:attr(data-text);position:absolute;top:0;color:inherit;background-color:var(--rb-glitch-bg);overflow:hidden;clip-path:inset(0 0 0 0)}
.rb-glitch::after{left:10px;text-shadow:var(--after-shadow,-10px 0 red);animation:rb-glitch var(--after-duration,3s) infinite linear alternate-reverse}
.rb-glitch::before{left:-10px;text-shadow:var(--before-shadow,10px 0 cyan);animation:rb-glitch var(--before-duration,2s) infinite linear alternate-reverse}
.rb-glitch.rb-glitch-hover:not(:hover):not(.is-on)::before,.rb-glitch.rb-glitch-hover:not(:hover):not(.is-on)::after{content:'';opacity:0;animation:none}
@keyframes rb-glitch{
0%{clip-path:inset(20% 0 50% 0)}5%{clip-path:inset(10% 0 60% 0)}10%{clip-path:inset(15% 0 55% 0)}15%{clip-path:inset(25% 0 35% 0)}
20%{clip-path:inset(30% 0 40% 0)}25%{clip-path:inset(40% 0 20% 0)}30%{clip-path:inset(10% 0 60% 0)}35%{clip-path:inset(15% 0 55% 0)}
40%{clip-path:inset(25% 0 35% 0)}45%{clip-path:inset(30% 0 40% 0)}50%{clip-path:inset(20% 0 50% 0)}55%{clip-path:inset(10% 0 60% 0)}
60%{clip-path:inset(15% 0 55% 0)}65%{clip-path:inset(25% 0 35% 0)}70%{clip-path:inset(30% 0 40% 0)}75%{clip-path:inset(40% 0 20% 0)}
80%{clip-path:inset(20% 0 50% 0)}85%{clip-path:inset(10% 0 60% 0)}90%{clip-path:inset(15% 0 55% 0)}95%{clip-path:inset(25% 0 35% 0)}
100%{clip-path:inset(30% 0 40% 0)}}`;

const DEFAULTS = {
  speed: 0.5,
  enableShadows: true,
  enableOnHover: false,
  background: '#120F17' // pseudo-layers must be opaque to cover the base text
};

export default function mount(el, opts = {}) {
  const o = { text: el.textContent, ...DEFAULTS, ...opts };
  const text = o.text;
  el.textContent = text; // pseudo-elements are ignored by screen readers; real text stays in el

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return { destroy() {}, play() {} };
  }

  if (!document.querySelector('style[data-rb="GlitchText"]')) {
    const s = document.createElement('style');
    s.dataset.rb = 'GlitchText';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  el.classList.add('rb-glitch');
  el.classList.toggle('rb-glitch-hover', !!o.enableOnHover);
  el.dataset.text = text;
  el.style.setProperty('--after-duration', `${o.speed * 3}s`);
  el.style.setProperty('--before-duration', `${o.speed * 2}s`);
  el.style.setProperty('--after-shadow', o.enableShadows ? '-5px 0 red' : 'none');
  el.style.setProperty('--before-shadow', o.enableShadows ? '5px 0 cyan' : 'none');
  el.style.setProperty('--rb-glitch-bg', o.background);

  let t = null;
  return {
    // Forces the glitch layers on for one cycle (only visible in enableOnHover mode; always-on otherwise).
    play() {
      el.classList.add('is-on');
      clearTimeout(t);
      t = setTimeout(() => el.classList.remove('is-on'), o.speed * 3000);
    },
    destroy() {
      clearTimeout(t);
      el.classList.remove('rb-glitch', 'rb-glitch-hover', 'is-on');
      delete el.dataset.text;
      for (const p of ['--after-duration', '--before-duration', '--after-shadow', '--before-shadow', '--rb-glitch-bg'])
        el.style.removeProperty(p);
    }
  };
}
