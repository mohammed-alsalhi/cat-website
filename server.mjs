// Zero-dep server: static files, agent API, and a Claude-backed concierge (local `claude` CLI, or ANTHROPIC_API_KEY).
import {createServer} from 'node:http';
import {readFile, appendFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {extname} from 'node:path';

const site=JSON.parse(await readFile('api/site.json','utf8'));
const MIME={'.html':'text/html; charset=utf-8','.json':'application/json','.txt':'text/plain; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'};
const json=(res,o,code=200)=>{res.writeHead(code,{'content-type':'application/json','access-control-allow-origin':'*'});res.end(JSON.stringify(o))};
const body=req=>new Promise(r=>{let b='';req.on('data',c=>b+=c);req.on('end',()=>{try{r(b?JSON.parse(b):{})}catch{r({})}})});

const SYSTEM=`You are the Caterpillar site concierge on caterpillar.com. Be brief, factual, brand-appropriate. Only use facts from the site data below; if unsure, say so and point to a canonical link.
Site data: ${JSON.stringify(site)}
Section ids: ${site.sections.map(s=>s.id).join(', ')}. Themes: light, dark, jobsite (high-contrast for outdoor use).
ALWAYS respond with ONLY a JSON object: {"reply":"<short text for the user>","actions":[...]}
Action types: {"type":"navigate","target":"<section id>"} {"type":"theme","value":"light|dark|jobsite"} {"type":"highlight","target":"<section id>"} {"type":"feedback","section":"<id>","text":"<critique>"}
When asked to critique or give feedback on a section, use the provided sectionText, give 2-3 concrete improvements, and emit a feedback action. When asked to explain a section, summarize its sectionText.`;

async function claude(messages,context){
 const convo=messages.map(m=>`${m.role.toUpperCase()}: ${m.content}`).join('\n')+`\n\n[context] user is viewing section "${context?.section}" in theme "${context?.theme}". sectionText: ${context?.sectionText||''}`;
 if(process.env.ANTHROPIC_API_KEY){
  const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify({model:'claude-sonnet-5',max_tokens:600,system:SYSTEM,messages:[{role:'user',content:convo}]})});
  return (await r.json()).content[0].text;
 }
 // ponytail: shell out to the local claude CLI (user's subscription, ~5-20s). Set ANTHROPIC_API_KEY for the fast path.
 return new Promise((ok,bad)=>execFile('claude',['-p',convo,'--system-prompt',SYSTEM,'--output-format','json','--model','haiku'],{maxBuffer:1e7,env:{...process.env,CLAUDECODE:''}},(e,out)=>{if(e)return bad(e);try{ok(JSON.parse(out).result)}catch{ok(out)}}));
}
const parse=t=>{try{return JSON.parse(t.match(/\{[\s\S]*\}/)[0])}catch{return {reply:t,actions:[]}}};
const hit=s=>o=>JSON.stringify(o).toLowerCase().includes(s);

createServer(async(req,res)=>{
 const u=new URL(req.url,'http://x');let p=u.pathname;const q=Object.fromEntries(u.searchParams);
 try{
  if(p==='/api/site.json')return json(res,site);
  if(p==='/api/brands')return json(res,site.brands);
  if(p==='/api/news')return json(res,site.news);
  if(p==='/api/search'){const s=(q.q||'').toLowerCase();return json(res,{sections:site.sections.filter(hit(s)),stories:site.stories.filter(hit(s)),brands:site.brands.filter(b=>b.toLowerCase().includes(s)),news:site.news.filter(hit(s))})}
  if(p==='/api/feedback'&&req.method==='POST'){const b=await body(req);await appendFile('feedback.jsonl',JSON.stringify({...b,ua:req.headers['user-agent']})+'\n');return json(res,{ok:true})}
  if(p==='/api/chat'&&req.method==='POST'){const b=await body(req);return json(res,parse(await claude(b.messages||[],b.context)))}
  // Stages B and C answer JSON to agents. Stage A is the plain clone and does not.
  if(/^\/[bc]\/?/.test(p)&&((req.headers.accept||'').startsWith('application/json')||q.format==='json')){const id=p.split('/')[2];return json(res,id?site.sections.find(s=>s.id===id)||{error:'no such section',sections:site.sections.map(s=>s.id)}:{...site,page:p,llms:'/llms.txt',agent:'/.well-known/agent.json'})}
  if(/^\/[abc]$/.test(p)){res.writeHead(301,{location:p+'/'});return res.end()}
  if(/^\/[abc]\/$/.test(p))p+='index.html';
  const f=p==='/'?'index.html':p.slice(1);
  const data=await readFile(f);res.writeHead(200,{'content-type':MIME[extname(f)]||'application/octet-stream','cache-control':'no-cache'});res.end(data);
 }catch(e){if(!res.headersSent)json(res,{error:e.message},p.startsWith('/api')?500:404);else res.end()}
}).listen(process.env.PORT||3000,()=>console.log('cat.com stages → http://localhost:'+(process.env.PORT||3000)));
