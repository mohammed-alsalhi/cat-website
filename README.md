# caterpillar.com — 45-minute hackathon, three stages

```bash
node server.mjs   # http://localhost:3000
```

| Stage | URL | What it adds |
| --- | --- | --- |
| **A · Recreate** | `/a/` | Faithful clone of today's caterpillar.com: utility bar, header with search, primary nav, 5-slide hero carousel, About, five tiles, brand carousel, Cat® Products & Services, Latest News, resources bar, full footer. Real fonts (Roboto Condensed + Noto Sans), real palette, real imagery. |
| **B · Agent friendly** | `/b/` | Same page, legible to machines: `/llms.txt`, generated JSON-LD, `data-agent-summary` on every section, `data-agent-action` on every CTA, `/.well-known/agent.json`, `/api/openapi.json`, `/api/search`, and `Accept: application/json` on any `/b/…` or `/c/…` URL returns the section as JSON. "View as agent" shows exactly what a machine receives. |
| **C · AI interfaces** | `/c/` | Concierge (press `/`): ask anything, by voice too; navigate; switch light / dark / jobsite themes; rate or critique any section; "Explain this section". GSAP scroll reveal with stagger, reduced-motion aware. Backend is the local `claude` CLI, or set `ANTHROPIC_API_KEY`. |

Skills used from the open registry: `vercel-labs/agent-skills@web-design-guidelines`, `emilkowalski/skills@improve-animations`, `emilkowalski/skills@animation-vocabulary` (see `.agents/skills/`).
