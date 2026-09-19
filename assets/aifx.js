// Stage C extras — TextType replies, Aurora header, live voice waveform, StarBorder on the Ask button.
(()=>{
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const css=`
#ask{background:#000 padding-box;border:2px solid transparent;background-image:linear-gradient(#000,#000),conic-gradient(from var(--a,0deg),#FFCD11,#000 30%,#FFCD11 50%,#000 80%,#FFCD11);background-origin:border-box;background-clip:padding-box,border-box}
@property --a{syntax:"<angle>";inherits:false;initial-value:0deg}
@media(prefers-reduced-motion:no-preference){#ask{animation:orbit 3s linear infinite}@keyframes orbit{to{--a:360deg}}}
#ask .shine{background:linear-gradient(110deg,#fff 40%,#FFCD11 50%,#fff 60%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:shine 2.5s linear infinite}@keyframes shine{to{background-position:-200% 0}}
#dlg header{position:relative;overflow:hidden}#dlg header canvas{position:absolute;inset:0;width:100%;height:100%;z-index:0}#dlg header>*{position:relative;z-index:1}
#wave{width:100%;height:36px;display:block;margin:0 12px 6px;width:calc(100% - 24px)}
#dlg[open]{animation:dlgin .5s cubic-bezier(.32,.72,0,1)}@keyframes dlgin{from{opacity:0;transform:translateY(24px) scale(.96);filter:blur(8px)}}
#dlg::backdrop{backdrop-filter:blur(8px);background:rgba(0,0,0,.45)}
.m.a{animation:min .5s cubic-bezier(.32,.72,0,1)}.m.u{animation:min .35s cubic-bezier(.32,.72,0,1)}@keyframes min{from{opacity:0;transform:translateY(12px) scale(.97)}}`;
document.head.appendChild(Object.assign(document.createElement('style'),{textContent:css}));
const ask=document.getElementById('ask');if(ask){ask.innerHTML='<span class="shine">✦ Ask Caterpillar</span> <kbd>/</kbd>'}
// Aurora in the dialog header (canvas 2D blobs)
const hdr=document.querySelector('#dlg header');if(hdr){const c=document.createElement('canvas');hdr.prepend(c);const ctx=c.getContext('2d');let t=0;
 function draw(){if(!document.getElementById('dlg').open)return requestAnimationFrame(draw);c.width=hdr.clientWidth;c.height=hdr.clientHeight;ctx.fillStyle='#FFCD11';ctx.fillRect(0,0,c.width,c.height);
  for(let i=0;i<4;i++){const x=c.width*(.5+.45*Math.sin(t*.0007+i*1.7)),y=c.height*(.5+.5*Math.cos(t*.0011+i)),g=ctx.createRadialGradient(x,y,0,x,y,c.width*.35);g.addColorStop(0,['rgba(255,255,255,.55)','rgba(0,0,0,.18)','rgba(255,240,150,.6)','rgba(0,0,0,.1)'][i]);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(0,0,c.width,c.height)}
  t+=reduced?0:16;requestAnimationFrame(draw)}draw()}
// TextType: type out assistant replies
const log=document.getElementById('log');if(log&&!reduced)new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(!(n.nodeType===1&&n.classList.contains('a'))||n.textContent==='Thinking…'||n.dataset.typed)return;const t=n.textContent;n.dataset.typed=1;n.textContent='';let i=0;const id=setInterval(()=>{n.textContent=t.slice(0,++i);log.scrollTop=1e9;if(i>=t.length)clearInterval(id)},9)}))).observe(log,{childList:true});
// Voice waveform while the mic is on (Web Audio analyser)
const mic=document.getElementById('mic');if(mic){const form=mic.closest('form');const wave=document.createElement('canvas');wave.id='wave';wave.hidden=true;form.before(wave);let ctxA,src,an,stream,raf;
 new MutationObserver(async()=>{if(mic.classList.contains('on')){try{stream=await navigator.mediaDevices.getUserMedia({audio:true});ctxA=new AudioContext();src=ctxA.createMediaStreamSource(stream);an=ctxA.createAnalyser();an.fftSize=256;src.connect(an);wave.hidden=false;const g=wave.getContext('2d'),buf=new Uint8Array(an.frequencyBinCount);
   (function d(){wave.width=wave.clientWidth;wave.height=36;an.getByteFrequencyData(buf);g.clearRect(0,0,wave.width,36);const n=48,w=wave.width/n;for(let i=0;i<n;i++){const v=buf[i*2]/255;g.fillStyle='#FFCD11';const h=Math.max(3,v*34);g.fillRect(i*w+1,18-h/2,w-3,h)}raf=requestAnimationFrame(d)})()}catch{}}
  else{cancelAnimationFrame(raf);stream?.getTracks().forEach(t=>t.stop());ctxA?.close();wave.hidden=true}}).observe(mic,{attributes:true,attributeFilter:['class']})}
})();
