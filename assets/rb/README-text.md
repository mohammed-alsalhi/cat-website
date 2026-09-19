# React Bits text animations — vanilla ports

Every module: `import mount from './<Name>.js'; const fx = mount(el, opts); fx.play(); fx.destroy();`
`opts.text` overrides `el.textContent`. Reduced-motion users get the plain text, no animation.
GSAP users (ScrambledText, TrueFocus, Shuffle) expect `window.gsap` 3.13 with SplitText + ScrollTrigger registered.

## DecryptedText
opts: `speed=50, maxIterations=10, sequential=false, revealDirection='start'|'end'|'center', useOriginalCharsOnly=false, characters='A-Za-z!@#$%^&*()_+', className='', encryptedClassName='', animateOn='hover'|'view'|'click'|'inViewHover'|'load', clickMode='once'|'toggle'`
```js
import mount from '/assets/rb/DecryptedText.js';
const fx = mount(document.querySelector('.hero h1'), { animateOn: 'view', sequential: true, revealDirection: 'center' });
// fx.play() re-runs the decrypt; fx.destroy() restores the plain text
```

## ScrambledText
opts: `radius=100, duration=1.2, speed=0.5, scrambleChars='.:'` (pointer-driven; `play()` scrambles every char once)
```js
import mount from '/assets/rb/ScrambledText.js';
const fx = mount(document.querySelector('.intro p'), { radius: 120, scrambleChars: '01' });
fx.play();
```

## GlitchText
opts: `speed=0.5, enableShadows=true, enableOnHover=false, background='#120F17'` (`background` must match the page behind the text; `play()` forces one glitch cycle in hover mode)
```js
import mount from '/assets/rb/GlitchText.js';
const fx = mount(document.querySelector('.glitch-title'), { enableOnHover: true, background: '#000' });
fx.play();
```

## TrueFocus
opts: `sentence=el.textContent, separator=' ', manualMode=false, blurAmount=5, borderColor='green', glowColor='rgba(0,255,0,0.6)', animationDuration=0.5, pauseBetweenAnimations=1` (`play()` advances to the next word)
```js
import mount from '/assets/rb/TrueFocus.js';
const fx = mount(document.querySelector('.focus-line'), { borderColor: '#ffcd11', glowColor: 'rgba(255,205,17,.6)' });
fx.play();
```

## Shuffle
opts: `shuffleDirection='right'|'left'|'up'|'down', duration=0.35, maxDelay=0, ease='power3.out', threshold=0.1, rootMargin='-100px', textAlign='center', onShuffleComplete=null, shuffleTimes=1, animationMode='evenodd'|'random', loop=false, loopDelay=0, stagger=0.03, scrambleCharset='', colorFrom, colorTo, triggerOnce=true, respectReducedMotion=true, triggerOnHover=true`
```js
import mount from '/assets/rb/Shuffle.js';
const fx = mount(document.querySelector('.stat'), { shuffleDirection: 'up', scrambleCharset: '0123456789', shuffleTimes: 3 });
fx.play(); // also fires on scroll-in (ScrollTrigger) and on hover
```

## FuzzyText
opts: `fontSize='clamp(2rem, 8vw, 8rem)'|number|'inherit', fontWeight=900, fontFamily='inherit', color='#fff', enableHover=true, baseIntensity=0.18, hoverIntensity=0.5, fuzzRange=30, fps=60, direction='horizontal'|'vertical'|'both', transitionDuration=0, clickEffect=false, glitchMode=false, glitchInterval=2000, glitchDuration=200, gradient=null, letterSpacing=0` (`play()` = one full-intensity burst)
```js
import mount from '/assets/rb/FuzzyText.js';
const fx = mount(document.querySelector('.error-code'), { fontSize: 'inherit', color: '#ffcd11', glitchMode: true });
fx.play();
```

## TextPressure
opts: `fontFamily='Roboto Flex', fontUrl=<Google Fonts Roboto Flex>, width=true, weight=true, italic=true, alpha=false, flex=true, stroke=false, scale=false, textColor='#FFFFFF', strokeColor='#FF0000', minFontSize=24` (sizes itself to `el.parentElement`; `play()` re-measures and recenters)
```js
import mount from '/assets/rb/TextPressure.js';
const fx = mount(document.querySelector('.pressure-wrap h1'), { textColor: '#ffcd11', stroke: true });
// needs a variable font with wght/wdth/ital axes; fontFamily:'inherit' keeps the page font
```
