// Stage C — AI interfaces: talk to the site (text + voice), navigate, change theme, per-section feedback and critique, scroll-reveal polish.
(()=>{
const $=s=>document.querySelector(s);
// ---------- theme (token swap; transitions suppressed during the flip so it snaps)
const THEMES=['light','dark','jobsite'];
function setTheme(t){if(!THEMES.includes(t))t='light';document.documentElement.classList.add('notransition');document.documentElement.dataset.theme=t;void document.body.offsetHeight;requestAnimationFrame(()=>document.documentElement.classList.remove('notransition'));try{localStorage.theme=t}catch{}document.querySelectorAll('.themectl button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===t));$('meta[name=theme-color]').content=t==='light'?'#fff':'#000';return t}
const ctl=document.createElement('div');ctl.className='themectl';ctl.setAttribute('role','group');ctl.setAttribute('aria-label','Theme');ctl.innerHTML=THEMES.map(t=>`<button type="button" data-t="${t}" aria-pressed="false">${t[0].toUpperCase()+t.slice(1)}</button>`).join('');
ctl.onclick=e=>e.target.dataset.t&&setTheme(e.target.dataset.t);$('.util .wrap').append(ctl);
let saved='dark';try{saved=localStorage.theme||'dark'}catch{}setTheme(saved);
// ---------- concierge dialog (native <dialog>: focus trap, Escape, inert, focus return for free)
document.body.insertAdjacentHTML('beforeend',`
<button id="ask" type="button" aria-haspopup="dialog" aria-controls="dlg"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.2 6.8L21 11l-6.8 2.2L12 20l-2.2-6.8L3 11l6.8-2.2z"/></svg>Ask Caterpillar<kbd>/</kbd></button>
<dialog id="dlg" aria-labelledby="dlgt">
 <header><span class="dot" aria-hidden="true"></span><span id="dlgt">Caterpillar Concierge</span><span class="hint">Esc to close</span><button type="button" aria-label="Close concierge" data-close><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button></header>
 <div id="log" role="log" aria-live="polite"><div class="m a">Ask me anything about Caterpillar. I can also take you to a section, switch the theme, or critique the part of the page you're looking at. Press the mic to talk.</div></div>
 <div class="chips"><button type="button">Switch to jobsite theme</button><button type="button">Take me to the brands</button><button type="button">What is wrong with the About section?</button><button type="button">Summarize today's news</button></div>
 <form><label for="q">Your question</label><input id="q" name="q" placeholder="Ask or say anything…" autocomplete="off" enterkeyhint="send"><button type="button" id="mic" aria-label="Speak your question" aria-pressed="false"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></button><button type="submit" aria-label="Send"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button></form>
</dialog>`);
const dlg=$('#dlg'),log=$('#log'),q=$('#q');let hist=[],last='';
const open=()=>{if(!dlg.open){dlg.showModal();q.focus()}};
$('#ask').onclick=open;dlg.querySelector('[data-close]').onclick=()=>dlg.close();
dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();open()}});
dlg.querySelectorAll('.chips button').forEach(b=>b.onclick=()=>ask(b.textContent));
dlg.querySelector('form').onsubmit=e=>{e.preventDefault();ask(q.value);q.value=''};
const add=(cls,t)=>{const d=document.createElement('div');d.className='m '+cls;d.textContent=t;log.appendChild(d);log.scrollTop=1e9;return d};
const sys=t=>add('s',t);
function currentSection(){let best='hero',y=innerHeight/2;for(const s of document.querySelectorAll('section[data-section]')){const r=s.getBoundingClientRect();if(r.top<y&&r.bottom>y)best=s.dataset.section}return best}
async function ask(text,retry){text=(text||'').trim();if(!text)return;if(!retry){add('u',text);hist.push({role:'user',content:text})}last=text;
 const fast=localIntent(text);if(fast)return run(fast);
 const wait=add('a thinking','');wait.innerHTML='<i></i><i></i><i></i>';wait.setAttribute('aria-label','Thinking');
 try{const sec=currentSection();const r=await fetch('/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({messages:hist,context:{section:sec,theme:document.documentElement.dataset.theme,sectionText:document.querySelector(`section[data-section="${sec}"]`)?.innerText.slice(0,1500)}})});
  if(!r.ok)throw new Error('HTTP '+r.status);wait.remove();run(await r.json())}
 catch(e){wait.className='m err';wait.textContent='Unable to reach the concierge. Check that the server is running, then try again.';const b=document.createElement('button');b.textContent='Try again';b.onclick=()=>{wait.remove();ask(last,true)};wait.appendChild(b)}
}
function run(j){if(j.reply){add('a',j.reply);hist.push({role:'assistant',content:j.reply});speak(j.reply)}
 for(const a of j.actions||[]){
  if(a.type==='navigate'){const el=document.querySelector(`section[data-section="${a.target}"]`)||document.getElementById(a.target);if(el){dlg.close();el.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});sys('→ '+a.target)}}
  if(a.type==='theme')sys('Theme: '+setTheme(a.value));
  if(a.type==='feedback'){fetch('/api/feedback',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({section:a.section,text:a.text,ts:Date.now()})});sys('Feedback filed on '+a.section)}
  if(a.type==='highlight'){const el=document.querySelector(`section[data-section="${a.target}"]`);if(el){el.style.outline='4px solid var(--yellow)';setTimeout(()=>el.style.outline='',2500)}}
 }}
// ponytail: regex fast-path so theme + navigation are instant and offline; the model handles everything else
function localIntent(s){s=s.toLowerCase();const th=THEMES.find(t=>s.includes(t));if(th&&/(theme|mode|switch|make|turn|go)/.test(s))return{reply:`Switched to the ${th} theme.`,actions:[{type:'theme',value:th}]};
 const ids=[...document.querySelectorAll('section[data-section]')].map(e=>e.dataset.section);const t=ids.find(i=>s.includes(i))||(s.includes('career')||s.includes('investor')?'tiles':null);
 if(t&&/(go|take|show|scroll|open|jump|navigate)/.test(s))return{reply:`Taking you to ${t}.`,actions:[{type:'navigate',target:t}]};return null}
// ---------- voice: native Web Speech API in and out
let rec,voice=false;const mic=$('#mic');
mic.onclick=()=>{const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return sys('Speech recognition is not available in this browser.');if(rec){rec.stop();return}
 voice=true;rec=new SR();rec.lang='en-US';rec.onresult=e=>ask(e.results[0][0].transcript);rec.onend=()=>{rec=null;mic.classList.remove('on');mic.setAttribute('aria-pressed','false')};mic.classList.add('on');mic.setAttribute('aria-pressed','true');rec.start()};
function speak(t){if(!voice||!('speechSynthesis'in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t.slice(0,300));u.rate=1.05;speechSynthesis.speak(u)}
// ---------- per-section feedback + "explain this"
for(const sec of document.querySelectorAll('section[data-section]')){const id=sec.dataset.section;const name=sec.getAttribute('aria-label')||id;
 sec.insertAdjacentHTML('afterbegin',`<div class="fb"><button type="button" aria-label="Rate ${name} section up" data-v="1">👍</button><button type="button" aria-label="Rate ${name} section down" data-v="-1">👎</button><button type="button" aria-label="Critique ${name} section" data-c>💬</button></div><button type="button" class="explain" data-x>✦ Explain this section</button>`);
 sec.querySelector('.fb').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.c){open();ask(`Give me feedback on the ${name} section`)}else{fetch('/api/feedback',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({section:id,vote:+b.dataset.v,ts:Date.now()})});b.textContent='✓';b.disabled=true}};
 sec.querySelector('[data-x]').onclick=()=>{open();ask(`Explain the ${name} section in two sentences`)}}
})();
