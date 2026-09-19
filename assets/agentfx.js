// Stage B showpiece — "Watch an agent read this page": scanline sweeps the page, each section lights up as its JSON is fetched and typed into a terminal (FaultyTerminal + TextType + DecryptedText ports).
(async()=>{
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const css=`
.scan{position:fixed;left:0;right:0;top:-4px;height:3px;background:var(--yellow);box-shadow:0 0 24px 6px rgba(255,205,17,.6);z-index:60;pointer-events:none;opacity:0}
.scan::after{content:"";position:absolute;inset:-60px 0 0;background:linear-gradient(180deg,transparent,rgba(255,205,17,.14))}
section.reading{box-shadow:inset 0 0 0 3px var(--yellow);transition:box-shadow .3s}
.chip{position:absolute;right:16px;bottom:16px;z-index:5;background:#000;color:var(--yellow);font:12px ui-monospace,Menlo,monospace;padding:6px 10px;border-radius:8px;box-shadow:0 10px 30px -10px #000;transform:scale(.8);opacity:0}
.term{position:fixed;left:16px;bottom:16px;width:min(460px,calc(100vw - 32px));max-height:46vh;background:#0b0b0b;color:#c8f7c5;font:12.5px/1.55 ui-monospace,Menlo,monospace;border:1px solid #2a2a2a;border-radius:12px;z-index:61;overflow:hidden;box-shadow:0 30px 80px -20px #000;transform:translateY(20px);opacity:0}
.term .bar{display:flex;gap:6px;align-items:center;background:#161616;padding:8px 12px;color:#888;font-size:11px}.term .bar i{width:10px;height:10px;border-radius:50%;background:#ff5f56;display:inline-block}.term .bar i:nth-child(2){background:#ffbd2e}.term .bar i:nth-child(3){background:#27c93f}
.term pre{margin:0;padding:12px 14px;white-space:pre-wrap;overflow:auto;max-height:calc(46vh - 34px)}
.term .k{color:var(--yellow)}.term .m{color:#8ab4f8}.term .d{color:#666}
.term .cur{display:inline-block;width:7px;height:13px;background:#c8f7c5;vertical-align:-2px;animation:blink 1s steps(2) infinite}@keyframes blink{50%{opacity:0}}
.term .close{position:absolute;right:8px;top:5px;background:none;border:0;color:#888;cursor:pointer;font-size:14px;min-width:24px;min-height:24px}
.term .scanfx{position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,transparent 0 3px,rgba(0,0,0,.18) 3px 4px)}
.agentbar .play{background:#fff;color:#000;margin-left:8px}`;
document.head.appendChild(Object.assign(document.createElement('style'),{textContent:css}));
const bar=await (async function w(){return document.querySelector('.agentbar')||(await new Promise(r=>setTimeout(r,50)),w())})();
const play=document.createElement('button');play.type='button';play.className='play';play.textContent='▶ Watch an agent read this page';bar.appendChild(play);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function type(el,html,speed=6){if(reduced){el.insertAdjacentHTML('beforeend',html);return}const t=document.createElement('template');t.innerHTML=html;
 for(const n of [...t.content.childNodes]){const text=n.textContent;const target=n.nodeType===1?el.appendChild(Object.assign(document.createElement(n.tagName.toLowerCase()),{className:n.className})):el;
  for(const ch of text){target.append(ch);el.scrollTop=1e9;await sleep(speed)}}}
async function decrypt(el,final){const glyphs='!<>-_\\/[]{}—=+*^?#ABCDEF0123456789';if(reduced){el.textContent=final;return}for(let i=0;i<=final.length;i++){el.textContent=final.slice(0,i)+[...final.slice(i)].map(()=>glyphs[Math.random()*glyphs.length|0]).join('');await sleep(14)}el.textContent=final}
let running=false;
play.onclick=async()=>{if(running)return;running=true;play.disabled=true;
 const scan=document.body.appendChild(Object.assign(document.createElement('div'),{className:'scan'}));
 const term=document.body.appendChild(Object.assign(document.createElement('div'),{className:'term',role:'log','ariaLive':'polite'}));
 term.innerHTML=`<div class="bar"><i></i><i></i><i></i><span class="title">agent · caterpillar.com</span></div><button class="close" aria-label="Close terminal">✕</button><pre></pre><div class="scanfx"></div>`;
 const pre=term.querySelector('pre');term.querySelector('.close').onclick=()=>{term.remove();scan.remove()};
 gsap.to(term,{opacity:1,y:0,duration:.6,ease:'expo.out'});gsap.to(scan,{opacity:1,duration:.3});
 await decrypt(term.querySelector('.title'),'agent · caterpillar.com · reading /b/');
 await type(pre,`<span class="d">$</span> <span class="k">GET</span> /llms.txt\n`);const llms=await fetch('/llms.txt').then(r=>r.text());await type(pre,`<span class="d">${llms.split('\n').slice(0,3).join('\n')}\n…</span>\n`,2);
 await type(pre,`<span class="d">$</span> <span class="k">GET</span> /b/ <span class="m">Accept: application/json</span>\n`);const site=await fetch('/b/site',{headers:{accept:'application/json'}}).then(r=>r.json());
 await type(pre,`<span class="d">→ 200 · ${site.sections.length} sections · ${document.querySelectorAll('[data-agent-action]').length} actions · JSON-LD ✓</span>\n\n`);
 const cur=document.createElement('span');cur.className='cur';pre.appendChild(cur);
 for(const sec of site.sections){const el=document.querySelector(`section[data-section="${sec.id}"]`);if(!el)continue;
  const r=el.getBoundingClientRect(),top=r.top+scrollY;
  (window.lenis?window.lenis.scrollTo(top-120,{duration:.9}):scrollTo({top:top-120,behavior:reduced?'auto':'smooth'}));
  await sleep(reduced?0:700);
  gsap.to(scan,{top:el.getBoundingClientRect().top+r.height*.4,duration:.6,ease:'power2.inOut'});
  el.classList.add('reading');
  const t0=performance.now();const j=await fetch('/b/'+sec.id,{headers:{accept:'application/json'}}).then(r=>r.json());const ms=Math.max(1,Math.round(performance.now()-t0));
  const chip=el.appendChild(Object.assign(document.createElement('div'),{className:'chip',textContent:`GET /b/${sec.id} → 200 · ${ms}ms`}));gsap.to(chip,{opacity:1,scale:1,duration:.5,ease:'back.out(2)'});
  cur.remove();await type(pre,`<span class="d">$</span> <span class="k">GET</span> /b/${sec.id}\n<span class="m">${sec.id}</span>: ${j.summary}\n<span class="d">actions:</span> ${[...el.querySelectorAll('[data-agent-action]')].map(a=>a.dataset.agentAction).join(', ')||'—'}\n\n`,4);pre.appendChild(cur);
  await sleep(reduced?0:500);el.classList.remove('reading')}
 cur.remove();await type(pre,`<span class="k">done.</span> Read ${site.sections.length} sections without parsing a single div.\n`);
 gsap.to(scan,{opacity:0,duration:.5,onComplete:()=>scan.remove()});running=false;play.disabled=false;play.textContent='▶ Watch again'};
})();
