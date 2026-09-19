// "Claude riding a tractor" — built per .claude/skills/landing-page-design (B5 gradient heading, B7 spring easing + blur fade-up, B11 word-by-word tagline reveal, flat backgrounds, spacing table).
(()=>{
const EASE='cubic-bezier(0.32,0.72,0,1)';
const css=`
.tag{background:var(--grey);padding:96px 24px;overflow:hidden}
.tag .wrap{display:grid;grid-template-columns:1.1fr 1fr;gap:48px;align-items:center}
.tag h2{font-size:clamp(36px,5vw,60px);max-width:680px;text-transform:none;line-height:1.05}
.tag h2 .w{display:inline-block;opacity:.3;transition:opacity .7s ${EASE};background:linear-gradient(90deg,#000,#666);-webkit-background-clip:text;background-clip:text;color:transparent}
[data-theme=dark] .tag h2 .w,[data-theme=jobsite] .tag h2 .w{background:linear-gradient(90deg,#fff,#9b9b9b);-webkit-background-clip:text;background-clip:text}
.tag h2 .w.on{opacity:1}
.tag p{max-width:680px;font-size:16px;color:var(--mute);margin:24px 0 0}
.tag .stage{position:relative;aspect-ratio:4/3;border-radius:16px;background:var(--bg);overflow:hidden;border:1px solid var(--grey2)}
.tag svg{width:100%;height:100%;display:block}
.tag .rig{transform:translateX(-110%);transition:transform 1.4s ${EASE}}
.tag .stage.on .rig{transform:translateX(0)}
.tag .fade{opacity:0;transform:translateY(64px);filter:blur(8px);transition:opacity .8s ${EASE},transform .8s ${EASE},filter .8s ${EASE}}
.tag .fade.on{opacity:1;transform:none;filter:none}
@media(prefers-reduced-motion:no-preference){
 .tag .stage.on .wheel{animation:spin 1.1s linear infinite;transform-box:fill-box;transform-origin:center}
 .tag .stage.on .body{animation:bob 1.1s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
 .tag .stage.on .puff{animation:puff 1.6s ${EASE} infinite;transform-box:fill-box;transform-origin:center}
 .tag .stage.on .puff:nth-child(2){animation-delay:.5s}.tag .stage.on .puff:nth-child(3){animation-delay:1s}
 .tag .stage.on .ground{animation:ground 1.1s linear infinite}
 .tag .stage.on .arm{animation:wave 2.2s ease-in-out infinite;transform-box:fill-box;transform-origin:left bottom}
}
@media(prefers-reduced-motion:reduce){.tag .rig{transition:none;transform:none}.tag .fade{transition:opacity .3s ease;transform:none;filter:none}.tag h2 .w{transition:opacity .3s ease}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes bob{50%{transform:translateY(-3px)}}
@keyframes puff{0%{opacity:0;transform:translate(0,0) scale(.5)}30%{opacity:.6}100%{opacity:0;transform:translate(-40px,-60px) scale(1.6)}}
@keyframes ground{to{stroke-dashoffset:-48}}
@keyframes wave{50%{transform:rotate(-25deg)}}
@media(max-width:800px){.tag .wrap{grid-template-columns:1fr}.tag{padding:64px 24px}}`;
const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);

const Y='#FFCD11',K='#111',C='#D97757';
const svg=`<svg viewBox="0 0 400 300" role="img" aria-labelledby="trt"><title id="trt">Claude, drawn as an orange starburst, driving a yellow Cat tractor</title>
<rect width="400" height="300" fill="var(--bg)"/>
<path class="ground" d="M0 250H400" stroke="var(--grey2)" stroke-width="4" stroke-dasharray="24 24"/>
<g class="rig">
 <g class="puff"><circle cx="126" cy="112" r="10" fill="var(--mute)"/></g><g class="puff"><circle cx="126" cy="112" r="10" fill="var(--mute)"/></g><g class="puff"><circle cx="126" cy="112" r="10" fill="var(--mute)"/></g>
 <g class="body">
  <rect x="120" y="120" width="10" height="50" fill="${K}"/>
  <path d="M100 170h150l20 30v30H90v-40z" fill="${Y}"/>
  <rect x="90" y="220" width="180" height="16" fill="${K}"/>
  <rect x="200" y="110" width="70" height="70" rx="8" fill="${K}"/>
  <rect x="208" y="118" width="54" height="40" rx="6" fill="#dff3ff"/>
  <rect x="260" y="160" width="60" height="14" rx="4" fill="${K}"/>
  <path d="M96 176h50v18H96z" fill="${K}" opacity=".9"/>
  <g transform="translate(233 150)">
   <ellipse cx="0" cy="18" rx="15" ry="20" fill="${C}"/>
   <g class="arm"><path d="M-2 22q-22-8-28-20" stroke="${C}" stroke-width="7" stroke-linecap="round" fill="none"/></g>
   <g transform="translate(0 -10)"><circle r="14" fill="${C}"/>
    ${[0,45,90,135,180,225,270,315].map(a=>`<path d="M0-13 L4-24 L0-30 L-4-24Z" fill="${C}" transform="rotate(${a})"/>`).join('')}
    <circle cx="-4" cy="-2" r="1.8" fill="${K}"/><circle cx="4" cy="-2" r="1.8" fill="${K}"/><path d="M-4 4q4 4 8 0" stroke="${K}" stroke-width="1.8" stroke-linecap="round" fill="none"/></g>
  </g>
  <text x="203" y="215" font-family="Roboto Condensed,Arial" font-weight="700" font-size="22" fill="${K}">CAT</text><path d="M236 215l6-10 6 10z" fill="${K}"/>
 </g>
 <g class="wheel"><circle cx="150" cy="232" r="46" fill="${K}"/><circle cx="150" cy="232" r="30" fill="${Y}"/><circle cx="150" cy="232" r="8" fill="${K}"/>${[0,60,120,180,240,300].map(a=>`<rect x="146" y="184" width="8" height="14" fill="${K}" transform="rotate(${a} 150 232)"/>`).join('')}</g>
 <g class="wheel"><circle cx="290" cy="242" r="30" fill="${K}"/><circle cx="290" cy="242" r="18" fill="${Y}"/><circle cx="290" cy="242" r="5" fill="${K}"/></g>
</g></svg>`;

const words='Machines that do the work. Now with Claude in the driver’s seat, doing the thinking.'.split(' ');
const sec=document.createElement('section');sec.className='tag';sec.id='claude';sec.dataset.section='claude';sec.setAttribute('aria-label','Claude rides a tractor');
sec.innerHTML=`<div class="wrap"><div class="fade"><h2>${words.map(w=>`<span class="w">${w}</span>`).join(' ')}</h2><p>Every section on this page can be read, navigated and critiqued by an AI. Press <kbd>/</kbd> and tell it where to drive.</p></div><div class="stage fade">${svg}</div></div>`;
document.getElementById('tiles').before(sec);

// B11: words activate one at a time in reading order as the heading crosses the trigger line
const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const el=e.target;el.classList.add('on');
 if(el.tagName==='H2')el.querySelectorAll('.w').forEach((w,i)=>setTimeout(()=>w.classList.add('on'),i*60));io.unobserve(el)}),{rootMargin:'0px 0px -20% 0px'});
sec.querySelectorAll('.fade,.stage,h2').forEach(el=>io.observe(el));
})();
