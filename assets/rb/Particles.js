// Port of React Bits <Particles> (OGL) to a vanilla ES module. Shaders are verbatim from the source.
import { Renderer, Camera, Geometry, Program, Mesh } from 'https://esm.sh/ogl@1.0.11';

const defaultColors = ['#ffffff', '#ffffff', '#ffffff'];

const hexToRgb = hex => {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map(c => c + c)
      .join('');
  }
  const int = parseInt(hex.slice(0, 6), 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  return [r, g, b];
};

const vertex = /* glsl */ `
  attribute vec3 position;
  attribute vec4 random;
  attribute vec3 color;
  
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uSpread;
  uniform float uBaseSize;
  uniform float uSizeRandomness;
  
  varying vec4 vRandom;
  varying vec3 vColor;
  
  void main() {
    vRandom = random;
    vColor = color;
    
    vec3 pos = position * uSpread;
    pos.z *= 10.0;
    
    vec4 mPos = modelMatrix * vec4(pos, 1.0);
    float t = uTime;
    mPos.x += sin(t * random.z + 6.28 * random.w) * mix(0.1, 1.5, random.x);
    mPos.y += sin(t * random.y + 6.28 * random.x) * mix(0.1, 1.5, random.w);
    mPos.z += sin(t * random.w + 6.28 * random.y) * mix(0.1, 1.5, random.z);
    
    vec4 mvPos = viewMatrix * mPos;

    if (uSizeRandomness == 0.0) {
      gl_PointSize = uBaseSize;
    } else {
      gl_PointSize = (uBaseSize * (1.0 + uSizeRandomness * (random.x - 0.5))) / length(mvPos.xyz);
    }

    gl_Position = projectionMatrix * mvPos;
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  
  uniform float uTime;
  uniform float uAlphaParticles;
  varying vec4 vRandom;
  varying vec3 vColor;
  
  void main() {
    vec2 uv = gl_PointCoord.xy;
    float d = length(uv - vec2(0.5));
    
    if(uAlphaParticles < 0.5) {
      if(d > 0.5) {
        discard;
      }
      gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), 1.0);
    } else {
      float circle = smoothstep(0.5, 0.4, d) * 0.8;
      gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), circle);
    }
  }
`;

export default function mount(el, opts = {}) {
  const {
    particleCount = 200,
    particleSpread = 10,
    speed = 0.1,
    particleColors = opts.color ? [opts.color] : opts.colorStops,
    moveParticlesOnHover = false,
    particleHoverFactor = 1,
    alphaParticles = false,
    particleBaseSize = 100,
    sizeRandomness = 1,
    cameraDistance = 20,
    disableRotation = false,
    pixelRatio = 1
  } = opts;

  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';

  const renderer = new Renderer({ dpr: pixelRatio, depth: false, alpha: true });
  const gl = renderer.gl;
  gl.canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
  el.appendChild(gl.canvas);
  gl.clearColor(0, 0, 0, 0);

  const camera = new Camera(gl, { fov: 15 });
  camera.position.set(0, 0, cameraDistance);

  const resize = () => {
    renderer.setSize(el.clientWidth, el.clientHeight);
    gl.canvas.style.width = gl.canvas.style.height = '100%';
    camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
  };
  const ro = new ResizeObserver(resize);
  ro.observe(el);
  resize();

  const mouse = { x: 0, y: 0 };
  const handleMouseMove = e => {
    const rect = el.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
  };
  if (moveParticlesOnHover) el.addEventListener('mousemove', handleMouseMove);

  const count = particleCount;
  const positions = new Float32Array(count * 3);
  const randoms = new Float32Array(count * 4);
  const colors = new Float32Array(count * 3);
  const palette = particleColors && particleColors.length > 0 ? particleColors : defaultColors;

  for (let i = 0; i < count; i++) {
    let x, y, z, len;
    do {
      x = Math.random() * 2 - 1;
      y = Math.random() * 2 - 1;
      z = Math.random() * 2 - 1;
      len = x * x + y * y + z * z;
    } while (len > 1 || len === 0);
    const r = Math.cbrt(Math.random());
    positions.set([x * r, y * r, z * r], i * 3);
    randoms.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
    colors.set(hexToRgb(palette[Math.floor(Math.random() * palette.length)]), i * 3);
  }

  const geometry = new Geometry(gl, {
    position: { size: 3, data: positions },
    random: { size: 4, data: randoms },
    color: { size: 3, data: colors }
  });

  const program = new Program(gl, {
    vertex,
    fragment,
    uniforms: {
      uTime: { value: 0 },
      uSpread: { value: particleSpread },
      uBaseSize: { value: particleBaseSize * pixelRatio },
      uSizeRandomness: { value: sizeRandomness },
      uAlphaParticles: { value: alphaParticles ? 1 : 0 }
    },
    transparent: true,
    depthTest: false
  });

  const particles = new Mesh(gl, { mode: gl.POINTS, geometry, program });

  let lastTime = performance.now();
  let elapsed = 0;

  const render = t => {
    const delta = t - lastTime;
    lastTime = t;
    elapsed += delta * speed;

    program.uniforms.uTime.value = elapsed * 0.001;

    if (moveParticlesOnHover) {
      particles.position.x = -mouse.x * particleHoverFactor;
      particles.position.y = -mouse.y * particleHoverFactor;
    } else {
      particles.position.x = 0;
      particles.position.y = 0;
    }

    if (!disableRotation) {
      particles.rotation.x = Math.sin(elapsed * 0.0002) * 0.1;
      particles.rotation.y = Math.cos(elapsed * 0.0005) * 0.15;
      particles.rotation.z += 0.01 * speed;
    }

    renderer.render({ scene: particles, camera });
  };

  // Loop control: reduced motion => one frame; hidden tab / off-screen => paused.
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0, onScreen = true;
  const update = t => { raf = requestAnimationFrame(update); render(t); };
  const start = () => {
    if (raf || reduced || !onScreen || document.hidden) return;
    lastTime = performance.now(); // no time jump after a pause
    raf = requestAnimationFrame(update);
  };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  const io = new IntersectionObserver(e => { onScreen = e[0].isIntersecting; onScreen ? start() : stop(); }, { threshold: 0 });
  io.observe(el);
  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVis);
  if (reduced) render(performance.now()); else start();

  return {
    destroy() {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      el.removeEventListener('mousemove', handleMouseMove);
      if (gl.canvas.parentNode === el) el.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  };
}
