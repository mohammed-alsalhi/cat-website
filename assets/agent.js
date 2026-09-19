// Stage B — make the page legible to agents. Adds JSON-LD, data-agent attributes, and an "Agent view" that shows what a machine sees.
(async()=>{
const site=await fetch('/api/site.json').then(r=>r.json());
// 1. JSON-LD generated from the same data agents fetch — one source of truth
const ld={"@context":"https://schema.org","@graph":[
 {"@type":"Organization","name":site.name,"url":site.url,"foundingDate":String(site.founded),"tickerSymbol":site.ticker,"description":site.description,"brand":site.brands.map(b=>({"@type":"Brand","name":b}))},
 {"@type":"WebSite","url":location.origin,"potentialAction":{"@type":"SearchAction","target":location.origin+"/api/search?q={q}","query-input":"required name=q"}},
 {"@type":"ItemList","name":"Latest News","itemListElement":site.news.map((n,i)=>({"@type":"ListItem","position":i+1,"item":{"@type":"NewsArticle","headline":n.title,"datePublished":n.date}}))}]};
const s=document.createElement('script');s.type='application/ld+json';s.textContent=JSON.stringify(ld);document.head.appendChild(s);
// 2. Annotate DOM: every section gets a machine summary + stable id, every CTA a declared action
for(const sec of site.sections){const el=document.querySelector(`section[data-section="${sec.id}"]`);if(el){el.setAttribute('data-agent-summary',sec.summary);el.setAttribute('aria-label',sec.title)}}
document.querySelectorAll('a.btn, .tile a').forEach(a=>a.setAttribute('data-agent-action',a.textContent.trim().toLowerCase().replace(/\s+/g,'-')));
document.querySelectorAll('[data-brand]').forEach(b=>b.setAttribute('itemprop','brand'));
// 3. Agent view toggle — renders the exact JSON an agent gets from this URL with Accept: application/json
const bar=document.createElement('div');bar.className='agentbar';bar.innerHTML=`<span>🤖 Agent-native page · <code>/llms.txt</code> · <code>Accept: application/json</code></span><button type="button" aria-expanded="false" aria-controls="agentview">View as agent</button>`;
document.body.prepend(bar);
const view=document.createElement('pre');view.id='agentview';view.hidden=true;view.className='agentview';bar.after(view);
bar.querySelector('button').onclick=async e=>{const open=view.hidden;view.hidden=!open;e.target.setAttribute('aria-expanded',open);e.target.textContent=open?'Hide agent view':'View as agent';if(open&&!view.textContent){const j=await fetch(location.pathname,{headers:{accept:'application/json'}}).then(r=>r.json());view.textContent=`GET ${location.pathname}\nAccept: application/json\n\n`+JSON.stringify(j,null,2)}};
window.SITE=site;
})();
