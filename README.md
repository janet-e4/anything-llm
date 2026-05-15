# Janet — E4 Studios fork of AnythingLLM

The E4 Studios fork of [AnythingLLM](https://github.com/Mintplex-Labs/anything-llm). This is now an **independent project**: it diverged from upstream and carries its own features, branding, and deployment. It no longer chases upstream `master` for new features — it tracks upstream **only to pull in security fixes** (see [SECURITY.md](./SECURITY.md)).

- **Fork:** https://github.com/janet-e4/anything-llm
- **Upstream:** https://github.com/Mintplex-Labs/anything-llm
- **Diverged from upstream at:** commit `b1e5b6f` — AnythingLLM **v1.12.1**
- **Production deployment:** https://zhealth.lvbs.com (Cloudflare tunnel → `localhost:3001`)
- **Config root:** `~/.openclaw/anythingllm/`

---

## Branch structure

| Branch | Tracks | Purpose |
|---|---|---|
| `master` | Mirror of `upstream/master` | Currently in sync with upstream at `b1e5b6f` (v1.12.1). Updated only via `git fetch upstream && git merge --ff-only upstream/master`. No E4 commits land here. Used as the merge source for upstream security fixes. |
| `feature/message-draft-autosave` | Off `master` | Upstream PR candidate (proposed as PR #5629). Restores the user's typed message after a provider error so they don't have to retype it. Tip commit `ec996ce`. |
| `e4/ui-customizations` | Off `feature/message-draft-autosave` | The only branch deployed to production. ~20 commits ahead of `b1e5b6f`. Contains the display-settings panel, Mintplex branding removal, telemetry-off, Cache-Control header patch, the DB-backed thread drafts + sharing feature, and the Z-Health customizations. |

The dependency chain is intentional: `e4/ui-customizations` carries the autosave fix as part of its history, so rebasing the feature branch on upstream also flows the fix into the E4 branch when E4 is rebased on top.

---

## E4 customizations (e4/ui-customizations)

- **Provider-error message recovery** — inherited from `feature/message-draft-autosave`. Restores the user's typed message to the textarea after a provider error. Proposed upstream as PR #5629; see [.github/pr-draft.md](./.github/pr-draft.md).
- **Display settings panel** — 3-tab UI (size, Google Fonts, markdown/HTML toggles) on the chat surface.
- **DB-backed thread drafts + sharing** — drafts persist to SQLite (survive device switches and provider errors); threads can be shared per-user with read/write permissions. Replaces the localStorage-only autosave. See [docs/THREAD_DRAFTS_AND_SHARING.md](./docs/THREAD_DRAFTS_AND_SHARING.md).
- **Telemetry off** — `DISABLE_TELEMETRY=true` in `.env`, plus the patched `server/index.js` sets `process.env.DISABLE_TELEMETRY = "true"` before any module loads, so the env var can never be unset at runtime. The "Anonymous Telemetry" toggle is also removed from the UI.
- **Branding removal** — all Mintplex/AnythingLLM external links stripped from sidebar, footers, errors, login fallback, TTS/microphone, embed link, and onboarding.
- **Cache-Control headers** — patched `server/index.js` static middleware sets `no-cache, must-revalidate` on unhashed entry points (`/index.js`, `/index.css`) and `public, max-age=31536000, immutable` on hashed assets. Prevents the dual-React-instance trap that produces React error #321.
- **Z-Health customizations** — the deployed `zhealth_research` workspace, 9 `/zh-*` slash commands, and 3 Z-Health agent flows (newsletter generator, email blast writer, landing-page copy generator). The flows and slash commands live in `~/.openclaw/anythingllm/storage/` on the deployment host and are not tracked in this repo. See [docs/z-health/COMMAND_GUIDE.md](./docs/z-health/COMMAND_GUIDE.md) and `~/.openclaw/anythingllm/storage/plugins/agent-flows/README.md`.

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
- Upgrade / rebase mechanics (branch handling): [UPGRADING.md](./UPGRADING.md)
- Deployment-specific upgrade runbook (image bumps, patched-file re-extraction, re-embedding): `~/.openclaw/anythingllm/UPGRADING.md`
- Fork provenance — what changed vs. upstream and where each feature came from: [docs/PROVENANCE.md](./docs/PROVENANCE.md)
- Thread drafts & sharing feature: [docs/THREAD_DRAFTS_AND_SHARING.md](./docs/THREAD_DRAFTS_AND_SHARING.md)
- Z-Health command guide: [docs/z-health/COMMAND_GUIDE.md](./docs/z-health/COMMAND_GUIDE.md)
- Open upstream PR draft (#5629): [.github/pr-draft.md](./.github/pr-draft.md)

---

## Infrastructure

| Component | Where | How it's reached |
|---|---|---|
| AnythingLLM container | Docker Compose at `~/.openclaw/anythingllm/`, image `mintplexlabs/anythingllm:1.12.1`, container name `anythingllm` | `localhost:3001` |
| LLM gateway | OpenClaw on host | `host.docker.internal:18789/v1` (`generic-openai` provider, model `openclaw`) |
| Vector DB | Qdrant on host | `host.docker.internal:6333` |
| Embeddings | Native `Xenova/nomic-embed-text-v1` (`EMBEDDING_ENGINE=native`) | In-container, 768-dim |
| Public URL | Cloudflare tunnel `zhealth-allm` | https://zhealth.lvbs.com → `localhost:3001` |

The deployed `zhealth_research` Qdrant collection holds **41,048 vectors** — the 41,041-vector Z-Health corpus plus 7 working documents uploaded through the UI. See [docs/z-health/COMMAND_GUIDE.md](./docs/z-health/COMMAND_GUIDE.md) for corpus provenance.

---

## Sources & references

- **Upstream project:** https://github.com/Mintplex-Labs/anything-llm — everything not listed under "E4 customizations" is inherited from upstream at `b1e5b6f` (v1.12.1).
- **Version pin:** Docker image `mintplexlabs/anythingllm:1.12.1`, divergence baseline commit `b1e5b6f961ed88c6d0f6f55186f4734ed3cd9439`.
- **Fork provenance:** [docs/PROVENANCE.md](./docs/PROVENANCE.md) — full per-feature attribution and the upstream diff baseline.
- **Upstream PR #5629** (`feature/message-draft-autosave`): the provider-error message recovery change, proposed back to Mintplex Labs.
- **Upstream security advisories** (monitored for the security-only sync): https://github.com/Mintplex-Labs/anything-llm/security/advisories

---

## License

This fork inherits the upstream **MIT License** (see [LICENSE](./LICENSE)). E4-specific additions are released under the same terms. The Z-Health agent-flow prompts and copy templates remain the property of E4 Studios but the surrounding infrastructure is MIT.
