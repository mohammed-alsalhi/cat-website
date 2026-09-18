// Zero-dep server: static files + agent API + Claude concierge (via local `claude` CLI or ANTHROPIC_API_KEY).
import {createServer} from 'node:http';
import {readFile, appendFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {extname} from 'node:path';

const site=JSON.parse(await readFile('api/site.json','utf8'));
const MIME={'.html':'text/html','.json':'application/json','.txt':'text/plain','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
const json=(res,o,code=200)=>{res.writeHead(code,{'content-type':'application/json','access-control-allow-origin':'*'});res.end(JSON.stringify(o))};
const body=req=>new Promise(r=>{let b='';req.on('data',c=>b+=c);req.on('end',()=>r(b?JSON.parse(b):{}))});

const SYSTEM=`You are the Cat Concierge on caterpillar.com (2028). Be brief, confident, Caterpillar-branded. You can act on the page.
Site data: ${JSON.stringify(site)}
Sections ids: ${site.sections.map(s=>s.id).join(', ')}. Themes: dark, light, jobsite (high-contrast for outdoor use).
ALWAYS respond with ONLY a JSON object: {"reply":"<short text for the user>","actions":[...]}
Action types: {"type":"navigate","target":"<section id>"} {"type":"theme","value":"dark|light|jobsite"} {"type":"highlight","target":"<section id>"} {"type":"feedback","section":"<id>","text":"<critique>"}
When asked to critique/give feedback on a section, use the provided sectionText, give 2-3 concrete improvements, and emit a feedback action. When asked to spec machines use the products list with prices. For dealers use the dealers list.`;

async function claude(messages,context){
 const convo=messages.map(m=>`${m.role.toUpperCase()}: ${m.content}`).join('\n')+`\n\n[context] user is viewing section "${context?.section}" in theme "${context?.theme}". sectionText: ${context?.sectionText||''}`;
 if(process.env.ANTHROPIC_API_KEY){
  const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:'claude-sonnet-5',max_tokens:600,system:SYSTEM,messages:[{role:'user',content:convo}]})});
  return (await r.json()).content[0].text;
 }
 // ponytail: shell out to local claude CLI (uses user's subscription; ~3-6s). Swap to API key for prod.
 return new Promise((ok,bad)=>execFile('claude',['-p',convo,'--system-prompt',SYSTEM,'--output-format','json','--model','haiku'],{maxBuffer:1e7,env:{...process.env,CLAUDECODE:''}},(e,out)=>{if(e)return bad(e);try{ok(JSON.parse(out).result)}catch{ok(out)}}));
}
const parse=t=>{try{return JSON.parse(t.match(/\{[\s\S]*\}/)[0])}catch{return {reply:t,actions:[]}}};

createServer(async(req,res)=>{
 const u=new URL(req.url,'http://x');const p=u.pathname;const q=Object.fromEntries(u.searchParams);
 try{
  if(p==='/api/site.json')return json(res,site);
  if(p==='/api/products')return json(res,site.products.filter(x=>(!q.power||x.power.includes(q.power))&&(!q.max_t||x.weight_t<=+q.max_t)&&(!q.family||x.family===q.family.toUpperCase())));
  if(p==='/api/dealers')return json(res,site.dealers.map(d=>({...d,distance_km:q.zip?Math.abs(parseInt(d.zip)||0-parseInt(q.zip)||0)%900:null})).sort((a,b)=>a.distance_km-b.distance_km).slice(0,3));
  if(p==='/api/search'){const s=(q.q||'').toLowerCase();const hit=o=>JSON.stringify(o).toLowerCase().includes(s);return json(res,{products:site.products.filter(hit),sections:site.sections.filter(hit),news:site.news.filter(hit)})}
  if(p==='/api/feedback'&&req.method==='POST'){const b=await body(req);await appendFile('feedback.jsonl',JSON.stringify({...b,ua:req.headers['user-agent']})+'\n');return json(res,{ok:true})}
  if(p==='/api/chat'&&req.method==='POST'){const b=await body(req);const out=parse(await claude(b.messages||[],b.context));return json(res,out)}
  // content negotiation: agents asking for JSON on any page get the section, not HTML
  if((req.headers.accept||'').startsWith('application/json')||q.format==='json'){const id=p.replace(/^\//,'')||'home';return json(res,site.sections.find(s=>s.id===id)||site)}
  const f=p==='/'?'index.html':p.slice(1);
  res.writeHead(200,{'content-type':MIME[extname(f)]||'text/plain'});res.end(await readFile(f));
 }catch(e){json(res,{error:e.message},p.startsWith('/api')?500:404)}
}).listen(process.env.PORT||3000,()=>console.log('cat.com 2028 → http://localhost:'+(process.env.PORT||3000)));
