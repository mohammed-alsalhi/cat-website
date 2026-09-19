// React Bits → vanilla ports: SplitText/BlurText, Magnet, StarBorder, SpotlightCard, TiltedCard, LogoLoop, CountUp, ScrollVelocity, ClickSpark, GlareHover, fluid island nav, Lenis.
(()=>{
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.add('fx');
gsap.registerPlugin(ScrollTrigger,SplitText);
// Lenis smooth scroll → GSAP ticker
if(window.Lenis&&!reduced){const lenis=new Lenis({lerp:.09});lenis.on('scroll',ScrollTrigger.update);gsap.ticker.add(t=>lenis.raf(t*1000));gsap.ticker.lagSmoothing(0);window.lenis=lenis}
// ---- Hero: crossfade + Ken Burns + SplitText chars on every slide change
const hero=document.querySelector('.hero');
function animateSlide(s){if(reduced)return;const h=s.querySelector('h1'),img=s.querySelector('img');
 if(!h._split)h._split=new SplitText(h,{type:'chars,words',charsClass:'char'});
 gsap.timeline().fromTo(s,{opacity:0},{opacity:1,duration:.6,ease:'power2.out'},0)
  .fromTo(img,{scale:1.12},{scale:1,duration:7,ease:'power1.out'},0)
  .fromTo(h._split.chars,{y:40,opacity:0,filter:'blur(8px)'},{y:0,opacity:1,filter:'blur(0px)',duration:.9,stagger:.018,ease:'expo.out'},.1)
  .fromTo(s.querySelectorAll('p,.btn'),{y:20,opacity:0},{y:0,opacity:1,duration:.7,stagger:.1,ease:'expo.out'},.5)}
new MutationObserver(ms=>ms.forEach(m=>{if(m.target.classList.contains('on'))animateSlide(m.target)})).observe(hero,{attributes:true,attributeFilter:['class'],subtree:true});
animateSlide(hero.querySelector('.slide.on'));
// ---- Fluid island nav (skill B7): primary nav becomes a floating glass pill after the hero
const nav=document.querySelector('nav.main');const spacer=document.createElement('div');spacer.className='navspacer';nav.after(spacer);
ScrollTrigger.create({start:'top -300',onToggle:({isActive})=>{nav.classList.toggle('island',isActive);spacer.classList.toggle('on',isActive);if(isActive&&!reduced)gsap.fromTo(nav,{y:-24,opacity:0},{y:0,opacity:1,duration:.7,ease:'expo.out'})}});
// ---- CountUp stats after About
document.querySelector('.about').insertAdjacentHTML('afterend',`<section class="stats" data-section="stats" aria-label="Caterpillar by the numbers"><div class="wrap">
 <div class="stat"><b data-to="100" data-suffix="+">0</b><span>Years building the world</span></div>
 <div class="stat"><b data-to="18">0</b><span>Brands in the family</span></div>
 <div class="stat"><b data-to="190" data-suffix="+">0</b><span>Countries with Cat dealers</span></div>
 <div class="stat"><b data-to="113" data-suffix="K">0</b><span>Employees worldwide</span></div></div></section>`);
document.querySelectorAll('.stat b').forEach(b=>{const o={v:0};ScrollTrigger.create({trigger:b,start:'top 85%',once:true,onEnter:()=>gsap.to(o,{v:+b.dataset.to,duration:reduced?0:2,ease:'expo.out',onUpdate:()=>b.textContent=Math.round(o.v)+(b.dataset.suffix||'')})})});
// ---- ScrollVelocity band before Brands
const velo=document.createElement('div');velo.className='velo';velo.setAttribute('aria-hidden','true');const words=Array(8).fill(['Let’s do the work','Caterpillar']).flat();velo.innerHTML=`<div class="row">${words.map(w=>`<span>${w}</span>`).join('')}</div>`;
document.querySelector('.brands').before(velo);
if(!reduced){const row=velo.querySelector('.row');let x=0;const half=()=>row.scrollWidth/2;gsap.ticker.add(()=>{const v=(window.lenis?window.lenis.velocity:0)||0;x-=1+Math.min(Math.abs(v)*.25,14);if(-x>half())x+=half();row.style.transform=`translateX(${x}px)`})}
// ---- LogoLoop: infinite brand marquee
const rowEl=document.querySelector('.brandrow');const items=rowEl.innerHTML;rowEl.innerHTML=`<div class="track">${items}${items}</div>`;rowEl.removeAttribute('tabindex');
// ---- SpotlightCard on tiles, brands; GlareHover on images
document.querySelectorAll('.tile,.brand,.catps img,.about img').forEach(el=>{el.classList.add(el.tagName==='IMG'?'glare':'spot');el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();el.style.setProperty('--mx',(e.clientX-r.left)+'px');el.style.setProperty('--my',(e.clientY-r.top)+'px')})});
document.querySelectorAll('.catps img,.about img').forEach(img=>{const w=document.createElement('div');w.className='glare';img.replaceWith(w);w.appendChild(img);w.style.borderRadius='12px'});
// ---- TiltedCard on news
if(!reduced)document.querySelectorAll('.newsgrid a').forEach(a=>{const rx=gsap.quickTo(a,'rotationX',{duration:.5,ease:'power3'}),ry=gsap.quickTo(a,'rotationY',{duration:.5,ease:'power3'}),sc=gsap.quickTo(a,'scale',{duration:.5,ease:'power3'});
 a.addEventListener('pointermove',e=>{const r=a.getBoundingClientRect();ry(((e.clientX-r.left)/r.width-.5)*16);rx(-((e.clientY-r.top)/r.height-.5)*16);sc(1.03)});a.addEventListener('pointerleave',()=>{rx(0);ry(0);sc(1)})});
// ---- Magnet on buttons
if(!reduced)document.querySelectorAll('.btn').forEach(b=>{const x=gsap.quickTo(b,'x',{duration:.6,ease:'elastic.out(1,.5)'}),y=gsap.quickTo(b,'y',{duration:.6,ease:'elastic.out(1,.5)'});
 b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect();x((e.clientX-r.left-r.width/2)*.25);y((e.clientY-r.top-r.height/2)*.35)});b.addEventListener('pointerleave',()=>{x(0);y(0)})});
// ---- ClickSpark
if(!reduced)document.addEventListener('pointerdown',e=>{for(let i=0;i<8;i++){const s=document.createElement('span');s.className='spark';s.style.left=e.clientX+'px';s.style.top=e.clientY+'px';document.body.appendChild(s);
 gsap.fromTo(s,{rotation:i*45,scaleY:1,opacity:1,y:0},{y:-28,scaleY:.2,opacity:0,duration:.45,ease:'power2.out',onComplete:()=>s.remove()})}});
// ---- BlurText scroll reveal for section headings + fade-up (skill B7)
if(!reduced){document.querySelectorAll('main h2:not(.tag h2)').forEach(h=>{const sp=new SplitText(h,{type:'words'});gsap.from(sp.words,{y:24,opacity:0,filter:'blur(6px)',duration:.8,stagger:.05,ease:'expo.out',scrollTrigger:{trigger:h,start:'top 88%',once:true}})});
 gsap.utils.toArray('.tile,.newsgrid a,.stat,.catps .wrap>*').forEach((el,i)=>gsap.from(el,{y:48,opacity:0,filter:'blur(8px)',duration:.9,ease:'expo.out',delay:(i%4)*.06,scrollTrigger:{trigger:el,start:'top 92%',once:true}}))}
ScrollTrigger.refresh();
})();
