// Hero carousel (mirrors caterpillar.com behaviour) — arrows, dots, autoplay with pause, keyboard.
(()=>{const hero=document.querySelector('.hero');if(!hero)return;const slides=[...hero.querySelectorAll('.slide')],dots=hero.querySelector('.dots');let i=0,t;
slides.forEach((_,n)=>{const b=document.createElement('button');b.setAttribute('aria-label',`Slide ${n+1}`);b.onclick=()=>go(n);dots.appendChild(b)});
function go(n){i=(n+slides.length)%slides.length;slides.forEach((s,k)=>s.classList.toggle('on',k===i));[...dots.children].forEach((d,k)=>k===i?d.setAttribute('aria-current','true'):d.removeAttribute('aria-current'));hero.querySelector('.status').textContent=`Slide ${i+1} of ${slides.length}`}
hero.querySelector('.prev').onclick=()=>go(i-1);hero.querySelector('.next').onclick=()=>go(i+1);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const play=()=>{if(!reduced)t=setInterval(()=>go(i+1),6000)};const stop=()=>clearInterval(t);
hero.addEventListener('mouseenter',stop);hero.addEventListener('mouseleave',play);hero.addEventListener('focusin',stop);hero.addEventListener('focusout',play);
const pause=hero.querySelector('.pause');let paused=reduced;pause.textContent=paused?'▶':'❚❚';pause.onclick=()=>{paused=!paused;paused?stop():play();pause.textContent=paused?'▶':'❚❚';pause.setAttribute('aria-label',paused?'Play carousel':'Pause carousel')};
go(0);play();
// brands scroller
const row=document.querySelector('.brandrow');document.querySelectorAll('.brands .ctl button').forEach(b=>b.onclick=()=>row.scrollBy({left:b.dataset.dir*row.clientWidth*.8,behavior:reduced?'auto':'smooth'}));
})();
