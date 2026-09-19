// Futuristic layer — mounts the vanilla React Bits ports (assets/rb) onto stages B and C.
const stage=location.pathname.split('/')[1];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const Y='#FFCD11';
const bg=(target,cls='rb-bg')=>{const d=document.createElement('div');d.className=cls;target.prepend(d);return d};
// ElectricBorder wraps its host's children, so give it a host around the grid to keep the columns intact
const electric=EB=>{const w=document.querySelector('.catps .wrap');if(!w)return;const host=document.createElement('div');host.className='eb-host';w.replaceWith(host);host.appendChild(w);EB(host,{color:Y,speed:.8,chaos:.1,thickness:2,borderRadius:20})};
const load=n=>import(`/assets/rb/${n}.js`).then(m=>m.default);
// Dark by default on B; C keeps its theme control but defaults to dark
if(stage==='b')document.documentElement.dataset.theme='dark';
(async()=>{
 const [LightRays,Particles,DecryptedText,Noise]=await Promise.all(['LightRays','Particles','DecryptedText','Noise'].map(load));
 // Hero: yellow light rays from the top-right corner, follow the mouse
 const hero=document.querySelector('.hero');LightRays(bg(hero,'rb-over'),{raysOrigin:'top-right',raysColor:Y,raysSpeed:1.2,lightSpread:.9,rayLength:1.6,followMouse:true,mouseInfluence:.15,noiseAmount:.05,distortion:.03});
 // Stats: floating yellow particles
 const stats=document.querySelector('.stats');if(stats)Particles(bg(stats),{particleCount:160,particleSpread:10,speed:.08,particleColors:[Y,'#ffffff',Y],alphaParticles:true,particleBaseSize:70,moveParticlesOnHover:true,particleHoverFactor:.6});
 // Section headings decrypt into place as they scroll in
 document.querySelectorAll('main h2').forEach(h=>DecryptedText(h,{animateOn:'view',sequential:true,revealDirection:'start',speed:14,maxIterations:6}));
 // Film grain over everything (very subtle)
 if(!reduced){const n=document.body.appendChild(Object.assign(document.createElement('div'),{className:'rb-noise'}));Noise(n,{patternAlpha:10,patternRefreshInterval:3})}
 if(stage==='b'){
  const [TargetCursor,ElectricBorder]=await Promise.all(['TargetCursor','ElectricBorder'].map(load));
  // Agent crosshair: the cursor locks onto anything an agent can act on
  document.querySelectorAll('[data-agent-action],.agentbar button,.tile,.brand,.newsgrid a').forEach(e=>e.classList.add('cursor-target'));
  TargetCursor(document.body,{cursorColor:Y,spinDuration:3,hoverDuration:.25});
  electric(ElectricBorder);
 }
 if(stage==='c'){
  const [Aurora,ElectricBorder]=await Promise.all(['Aurora','ElectricBorder'].map(load));
  const news=document.querySelector('.news');if(news)Aurora(bg(news),{colorStops:[Y,'#3a2e00',Y],amplitude:1.1,blend:.6,speed:.6});
  electric(ElectricBorder);
 }
})().catch(e=>console.error('future layer',e));
