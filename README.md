# Janet — E4 Studios fork of AnythingLLM

Private deployment of [AnythingLLM](https://github.com/Mintplex-Labs/anything-llm) customized for E4 Studios. This fork tracks upstream `master` and layers E4-specific features and branding via the `e4/ui-customizations` branch.

- **Fork:** https://github.com/janet-e4/anything-llm
- **Upstream:** https://github.com/Mintplex-Labs/anything-llm
- **Production deployment:** https://zhealth.lvbs.com (Cloudflare tunnel → `localhost:3001`)
- **Config root:** `~/.openclaw/anythingllm/`

---

## Branch structure

| Branch | Purpose |
|---|---|
| `master` | Upstream tracking. Updated only via `git fetch upstream && git merge upstream/master`. No E4 commits land here. |
| `feature/message-draft-autosave` | Upstream PR candidate (#5629). Restores the user's typed message after a provider error so they don't have to retype it. Branched off `master`. |
| `e4/ui-customizations` | E4 private branch — the only branch deployed to production. Branched off `feature/message-draft-autosave`. Contains the display-settings panel, Mintplex branding removal, telemetry-off hardcode, Cache-Control header patch, and the Z-Health agent flows. |

The dependency chain is intentional: `e4/ui-customizations` carries the autosave fix as part of its history, so rebasing the feature branch on upstream also flows the fix into the E4 branch when we rebase E4 on top.

---

## E4 customizations (e4/ui-customizations)

- **Display settings panel** — 3-tab UI (size, Google Fonts, markdown/HTML toggles) on the chat surface.
- **Draft autosave** — typed messages are persisted to localStorage with a "Saved · just now" timestamp indicator; restored on refresh or after a provider error.
- **Provider-error message recovery** — see PR #5629 (proposed upstream).
- **Telemetry off** — `DISABLE_TELEMETRY=true` in `.env`, plus a hardcoded short-circuit in `server/index.js` so no anonymous events can ever fire.
- **Branding removal** — all Mintplex/AnythingLLM external links stripped from sidebar, footers, and onboarding.
- **Cache-Control headers** — patched `server/index.js` static middleware sets `no-cache` on unhashed entry points (`/index.js`, `/index.css`) and `immutable` on hashed assets. Prevents the dual-React-instance trap that produces React error #321.
- **Z-Health agent flows** — newsletter generator, email blast writer, landing-page copy generator. See `~/.openclaw/anythingllm/storage/plugins/agent-flows/README.md`.

---

## Local development

```bash
git clone https://github.com/janet-e4/anything-llm ~/Projects/anything-llm
cd ~/Projects/anything-llm
git remote add upstream https://github.com/Mintplex-Labs/anything-llm
git checkout e4/ui-customizations

cd frontend
npm install
npm run build
```

The deployed container at `~/.openclaw/anythingllm/` bind-mounts `frontend/dist/` into `/app/server/public/`, so `npm run build` is the only step needed to see a change live — restart the container or hard-refresh the browser. The Vite dev server is intentionally **not** used in this fork because production runs against the bind-mounted build.

To test locally:
1. Build the frontend (above).
2. `cd ~/.openclaw/anythingllm && docker compose up -d`.
3. Open http://localhost:3001 in a fresh browser profile or Incognito window to avoid stale module caches.

Detailed runbook: [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## Quick links

- Deployment runbook: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Contributing & branch workflow: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Security model & secret inventory: [SECURITY.md](./SECURITY.md)
- Upgrade procedures (image bumps, re-embedding, override re-application): `~/.openclaw/anythingllm/UPGRADING.md`
- Open upstream PR draft: [.github/pr-draft.md](./.github/pr-draft.md)

---

## Infrastructure

| Component | Where | How it's reached |
|---|---|---|
| AnythingLLM container | Docker Compose at `~/.openclaw/anythingllm/` | `localhost:3001` |
| LLM gateway | OpenClaw on host | `host.docker.internal:18789/v1` (generic-openai provider, model `openclaw`) |
| Vector DB | Qdrant container `qdrant` | `host.docker.internal:6333` |
| Embeddings | Native Xenova `nomic-embed-text-v1` | In-container, 768-dim |
| Public URL | Cloudflare tunnel `zhealth-allm` | https://zhealth.lvbs.com → `localhost:3001` |

---

## License

This fork inherits the upstream **MIT License** (see [LICENSE](./LICENSE)). E4-specific additions are released under the same terms. The Z-Health agent-flow prompts and copy templates remain the property of E4 Studios but the surrounding infrastructure is MIT.
