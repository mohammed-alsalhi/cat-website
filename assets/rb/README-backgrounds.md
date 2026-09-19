# React Bits backgrounds, vanilla ES modules

Every module: `export default function mount(el, opts = {}) -> { destroy() }`. It fills `el` with an absolutely positioned canvas (sets `el.style.position = 'relative'` only if `el` was static); you set the z-index. Reduced motion renders one frame and stops; the loop also pauses when the tab is hidden or `el` is off-screen. OGL loads from `https://esm.sh/ogl@1.0.11`.

| Module | opts (defaults) |
|---|---|
| `Aurora.js` | `colorStops=['#5227FF','#7cff67','#5227FF']`, `amplitude=1`, `blend=0.5`, `lightMode=false`, `speed=1`, `time` (fixed time, optional) |
| `LightRays.js` | `raysOrigin='top-center'` (`top-left`, `top-right`, `left`, `right`, `bottom-left`, `bottom-center`, `bottom-right`), `raysColor='#ffffff'` (alias `color`), `raysSpeed=1`, `lightSpread=1`, `rayLength=2`, `pulsating=false`, `fadeDistance=1`, `saturation=1`, `followMouse=true` (window mousemove), `mouseInfluence=0.1`, `noiseAmount=0`, `distortion=0`, `lightMode=false` |
| `Particles.js` | `particleCount=200`, `particleSpread=10`, `speed=0.1`, `particleColors=['#ffffff' x3]` (aliases `color` (single) / `colorStops`), `moveParticlesOnHover=false`, `particleHoverFactor=1`, `alphaParticles=false`, `particleBaseSize=100`, `sizeRandomness=1`, `cameraDistance=20`, `disableRotation=false`, `pixelRatio=1` |
| `Threads.js` | `color=[1,1,1]` (also accepts hex string), `amplitude=1`, `distance=0`, `enableMouseInteraction=false` (mouse on `el`) |
| `DarkVeil.js` | `hueShift=0`, `noiseIntensity=0`, `scanlineIntensity=0`, `speed=0.5`, `scanlineFrequency=0`, `warpAmount=0`, `resolutionScale=1`, `lightMode=false`. No color prop (fixed CPPN palette); steer with `hueShift`. |

Not ported: `GridScan` (Three.js + `postprocessing` + `face-api.js`, not OGL).

## Usage

```js
import mountAurora from '/assets/rb/Aurora.js';
const bg = mountAurora(document.querySelector('.hero'), { colorStops: ['#FFCD11', '#FFCD11', '#111111'], amplitude: 1.2 });
// later: bg.destroy();
```
