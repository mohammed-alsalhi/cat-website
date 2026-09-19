# React Bits ports (vanilla ES modules)

Every module: `export default function mount(el, opts = {})` → `{ destroy() }`.
All honor `prefers-reduced-motion` (cursors no-op, overlays draw one static frame) and pause while `document.hidden`.
`destroy()` removes listeners, cancels rAF, and removes created DOM.

## SplashCursor.js
Cursor. `el` = container (default `document.body`). Creates a fixed full-viewport canvas, `pointer-events:none`.
Opts: `SIM_RESOLUTION=128, DYE_RESOLUTION=1440, CAPTURE_RESOLUTION=512, DENSITY_DISSIPATION=3.5, VELOCITY_DISSIPATION=2, PRESSURE=0.1, PRESSURE_ITERATIONS=20, CURL=3, SPLAT_RADIUS=0.2, SPLAT_FORCE=6000, SHADING=true, COLOR_UPDATE_SPEED=10, BACK_COLOR={r:0.5,g:0,b:0}, TRANSPARENT=true, RAINBOW_MODE=true, COLOR='#ff0000', zIndex=1`

```js
import splash from '/assets/rb/SplashCursor.js';
const fx = splash(document.body, { RAINBOW_MODE: false, COLOR: '#FFCD11' });
// later: fx.destroy();
```

## ElectricBorder.js
Wrapper. `el` = element whose children get wrapped (`.eb-canvas-container`, `.eb-layers`, `.eb-content`).
Opts: `color='#FFCD11', speed=1, chaos=0.12, thickness=2, borderRadius=24`

```js
import electric from '/assets/rb/ElectricBorder.js';
const fx = electric(document.querySelector('.card'), { chaos: 0.2 });
// later: fx.destroy();  // unwraps children
```

## TargetCursor.js
Cursor. `el` = container (default `document.body`). Needs `window.gsap`. No-op on mobile.
Opts: `targetSelector='.cursor-target', spinDuration=2, hideDefaultCursor=true, hoverDuration=0.2, parallaxOn=true, cursorColor='#ffffff', cursorColorOnTarget=undefined`

```js
import target from '/assets/rb/TargetCursor.js';
const fx = target(document.body, { targetSelector: 'a, button', cursorColorOnTarget: '#FFCD11' });
// later: fx.destroy();
```

## MetaBalls.js
Overlay (OGL from esm.sh). `el` = sized container; canvas fills it.
Opts: `color='#ffffff', speed=0.3, enableMouseInteraction=true, hoverSmoothness=0.05, animationSize=30, ballCount=15, clumpFactor=1, cursorBallSize=3, cursorBallColor='#ffffff', enableTransparency=false`

```js
import metaballs from '/assets/rb/MetaBalls.js';
const fx = metaballs(document.querySelector('#hero-bg'), { color: '#FFCD11', enableTransparency: true });
// later: fx.destroy();
```

## MagnetLines.js
Grid. `el` = container; `rows*columns` `<span>` lines are appended and rotate toward the pointer.
Opts: `rows=9, columns=9, containerSize='80vmin', lineColor='#efefef', lineWidth='1vmin', lineHeight='6vmin', baseAngle=-10`

```js
import magnet from '/assets/rb/MagnetLines.js';
const fx = magnet(document.querySelector('#lines'), { lineColor: '#FFCD11', rows: 12, columns: 12 });
// later: fx.destroy();
```

## Noise.js
Overlay. `el` = positioned container; appends a `100vw x 100vh` absolute grain canvas.
Opts: `patternSize=250, patternScaleX=1, patternScaleY=1, patternRefreshInterval=2, patternAlpha=15` (first three accepted for parity, unused by the source)

```js
import noise from '/assets/rb/Noise.js';
const fx = noise(document.querySelector('.hero'), { patternAlpha: 20 });
// later: fx.destroy();
```

## Skipped
- **LaserFlow** — source imports `three`; not OGL/raw WebGL.
