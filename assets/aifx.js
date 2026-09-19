// Stage C extras — TextType replies, Aurora header, live voice waveform, StarBorder on the Ask button.
(()=>{
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const css=`
#wave{width:100%;height:36px;display:block;margin:0 12px 6px;width:calc(100% - 24px)}
#dlg[open]{animation:dlgin .5s cubic-bezier(.32,.72,0,1)}@keyframes dlgin{from{opacity:0;transform:translateY(24px) scale(.96);filter:blur(8px)}}
#dlg::backdrop{backdrop-filter:blur(8px);background:rgba(0,0,0,.45)}
.m.a{animation:min .5s cubic-bezier(.32,.72,0,1)}.m.u{animation:min .35s cubic-bezier(.32,.72,0,1)}@keyframes min{from{opacity:0;transform:translateY(12px) scale(.97)}}`;
document.head.appendChild(Object.assign(document.createElement('style'),{textContent:css}));
// TextType: type out assistant replies
const log=document.getElementById('log');if(log&&!reduced)new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(!(n.nodeType===1&&n.classList.contains('a'))||n.classList.contains('thinking')||n.dataset.typed)return;const t=n.textContent;n.dataset.typed=1;n.textContent='';let i=0;const id=setInterval(()=>{n.textContent=t.slice(0,++i);log.scrollTop=1e9;if(i>=t.length)clearInterval(id)},9)}))).observe(log,{childList:true});
// Voice waveform while the mic is on (Web Audio analyser)
const mic=document.getElementById('mic');if(mic){const form=mic.closest('form');const wave=document.createElement('canvas');wave.id='wave';wave.hidden=true;form.before(wave);let ctxA,src,an,stream,raf;
 new MutationObserver(async()=>{if(mic.classList.contains('on')){try{stream=await navigator.mediaDevices.getUserMedia({audio:true});ctxA=new AudioContext();src=ctxA.createMediaStreamSource(stream);an=ctxA.createAnalyser();an.fftSize=256;src.connect(an);wave.hidden=false;const g=wave.getContext('2d'),buf=new Uint8Array(an.frequencyBinCount);
   (function d(){wave.width=wave.clientWidth;wave.height=36;an.getByteFrequencyData(buf);g.clearRect(0,0,wave.width,36);const n=48,w=wave.width/n;for(let i=0;i<n;i++){const v=buf[i*2]/255;g.fillStyle='#FFCD11';const h=Math.max(3,v*34);g.fillRect(i*w+1,18-h/2,w-3,h)}raf=requestAnimationFrame(d)})()}catch{}}
  else{cancelAnimationFrame(raf);stream?.getTracks().forEach(t=>t.stop());ctxA?.close();wave.hidden=true}}).observe(mic,{attributes:true,attributeFilter:['class']})}
})();
