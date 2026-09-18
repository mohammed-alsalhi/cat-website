# caterpillar.com — 2028 edition (45-min hackathon)

```bash
node server.mjs   # http://localhost:3000
```

- **A · Recreate** — `index.html`: full homepage (nav, hero, products, services, technology, sustainability, investors, dealers, careers, news, footer) in Cat yellow/black, 2028 styling.
- **B · Agent-friendly** — `/llms.txt`, `/api/site.json`, `/api/products`, `/api/dealers`, `/api/search`, `/api/openapi.json`, `/.well-known/agent.json`, JSON-LD, and `Accept: application/json` on any page returns structured data instead of HTML.
- **C · AI interfaces** — Cat Concierge (bottom-right or press `/`): talk by voice (Web Speech API), navigate, change theme (dark / light / jobsite), critique & file feedback on any section (👍👎💬 on hover), spec a fleet, find a dealer. Backend: local `claude` CLI, or set `ANTHROPIC_API_KEY`.
