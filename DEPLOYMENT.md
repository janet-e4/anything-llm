# Deployment Runbook — E4 Studios fork of AnythingLLM

From-scratch instructions for bringing up the fork on a new machine. The production deployment lives at `~/.openclaw/anythingllm/` and is exposed publicly at https://zhealth.lvbs.com via a Cloudflare tunnel.

The deployment runs the published image `mintplexlabs/anythingllm:1.12.1` with five bind mounts layering the fork's customizations on top (see step 5). For ongoing upgrade work (image bumps, patched-file re-extraction, re-embedding) see `~/.openclaw/anythingllm/UPGRADING.md`. For branch/rebase mechanics see [UPGRADING.md](./UPGRADING.md).

---

## Prerequisites

| Requirement | How to check |
|---|---|
| Docker Desktop running | `docker info` returns a server section without errors |
| OpenClaw gateway on port 18789 | `curl http://localhost:18789/health` -> `{"ok":true,"status":"live"}` |
| Qdrant container `qdrant` on port 6333 | `curl http://localhost:6333/readyz` -> `all shards are ready` |
| `cloudflared` installed | `cloudflared --version` |
| Node.js 18+ and npm | `node --version` (>= v18) |
| Git with the `upstream` remote configured | see [CONTRIBUTING.md](./CONTRIBUTING.md) |

OpenClaw configuration lives at `~/.openclaw/openclaw.json` and is loaded by the LaunchAgent `com.openclaw.gateway`. If the gateway isn't running, start it with `launchctl kickstart -k gui/$UID/com.openclaw.gateway` before continuing.

---

## Initial deployment

### 1. Clone the fork

```bash
git clone https://github.com/janet-e4/anything-llm ~/Projects/anything-llm
cd ~/Projects/anything-llm
git remote add upstream https://github.com/Mintplex-Labs/anything-llm
git fetch --all
```

### 2. Check out the E4 branch

```bash
git checkout e4/ui-customizations
```

This is the only branch that should ever be deployed. The `master` and `feature/*` branches are for upstream tracking and PR work — they don't include E4 branding, telemetry hardcode, or the Z-Health agent flows.

### 3. Build the frontend

```bash
cd ~/Projects/anything-llm/frontend
npm install
npm run build
```

This produces `frontend/dist/`, which Docker Compose bind-mounts into `/app/server/public/` inside the container. There is no separate frontend service — the Express backend serves the static build.

### 4. Configure environment

Copy or edit `~/.openclaw/anythingllm/.env`. These are the variables the live container actually runs with (verified via `docker exec anythingllm printenv`):

```bash
# Runtime
ANYTHING_LLM_RUNTIME=docker
STORAGE_DIR=/app/server/storage

# Auth — JWT signing secret for login tokens
JWT_SECRET=<64-hex-char string>            # openssl rand -hex 32

# LLM provider — OpenClaw via generic-openai
LLM_PROVIDER=generic-openai
GENERIC_OPEN_AI_BASE_PATH=http://host.docker.internal:18789/v1
GENERIC_OPEN_AI_MODEL_PREF=openclaw
GENERIC_OPEN_AI_API_KEY=<openclaw bearer token from ~/.openclaw/openclaw.json>
GENERIC_OPEN_AI_MAX_TOKENS=4096
GENERIC_OPEN_AI_MODEL_TOKEN_LIMIT=128000

# Embeddings — native in-container model, 768-dim
EMBEDDING_ENGINE=native
EMBEDDING_MODEL_PREF=Xenova/nomic-embed-text-v1

# Vector DB — Qdrant on host
VECTOR_DB=qdrant
QDRANT_ENDPOINT=http://host.docker.internal:6333
QDRANT_API_KEY=                            # empty — local Qdrant has no auth
```

Notes:
- `DISABLE_TELEMETRY` does **not** need to be set here — the patched `server/index.js` forces `process.env.DISABLE_TELEMETRY = "true"` at startup before any module loads (see [SECURITY.md](./SECURITY.md#telemetry)). Setting it in `.env` as well is harmless belt-and-suspenders but not required.
- There are **no** `SIG_KEY` / `SIG_SALT` variables in this deployment — AnythingLLM 1.12.1 does not use them. Do not add them.

Generate the JWT secret for a brand-new deployment:

```bash
echo "JWT_SECRET=$(openssl rand -hex 32)" >> ~/.openclaw/anythingllm/.env
```

Never commit this file. See [SECURITY.md](./SECURITY.md) for the complete secret inventory.

### 5. Start the container

```bash
cd ~/.openclaw/anythingllm
docker compose up -d
docker compose logs -f anythingllm
```

The compose file (`~/.openclaw/anythingllm/docker-compose.yml`) runs `mintplexlabs/anythingllm:1.12.1` with **five** bind mounts:

| Host path | Container path | Purpose |
|---|---|---|
| `./storage` | `/app/server/storage` | DB, documents, models, plugins, agent flows |
| `./qdrant-provider.js` | `/app/server/utils/vectorDbProviders/qdrant/index.js` | Patched Qdrant provider |
| `~/Projects/anything-llm/frontend/dist` | `/app/server/public` | Fork frontend build |
| `./server-index.js` | `/app/server/index.js` | Cache-Control headers + telemetry forced off |
| `./MetaGenerator.js` | `/app/server/utils/boot/MetaGenerator.js` | Emits `<script src="/index.js">` with **no** `?v=` query stamp |

The three `.js` override files must already exist in `~/.openclaw/anythingllm/` before the first `up`. On a brand-new machine they are produced by extracting the originals from the image and re-applying the patches — see `~/.openclaw/anythingllm/UPGRADING.md` ("Custom overrides preserved across upgrades"). Note: the `MetaGenerator.js` comment in `docker-compose.yml` is stale — it says the file "appends index.js mtime as `?v=`", but the actual patched file does the **opposite** (it removes the query stamp; the `?v=` stamp caused React error #321).

### 6. Verify

```bash
curl http://localhost:3001/api/ping
# expected: {"online":true}
```

The container healthcheck also hits `/api/ping`; `docker ps` should show `(healthy)` within ~60s. Then open http://localhost:3001 in a browser. If the page loads but the UI is broken, see "Recovering from issues" below.

### 7. Set up the Cloudflare tunnel (production only)

```bash
# Authenticate once
cloudflared tunnel login

# Create the tunnel (only first time)
cloudflared tunnel create zhealth-allm

# Edit ~/.cloudflared/config.yml:
#   tunnel: <tunnel-id>
#   credentials-file: /Users/owner/.cloudflared/<tunnel-id>.json
#   ingress:
#     - hostname: zhealth.lvbs.com
#       service: http://localhost:3001
#     - service: http_status:404

# Route DNS
cloudflared tunnel route dns zhealth-allm zhealth.lvbs.com

# Run as a LaunchAgent
sudo cloudflared service install
```

Verify externally: `curl -I https://zhealth.lvbs.com` should return `HTTP/2 200` (after auth bounce if Cloudflare Access is enabled).

---

## First-time DB setup

On first boot the container auto-creates `storage/anythingllm.db` (SQLite) if it doesn't exist. After the first request to `/`, the UI redirects to an onboarding flow.

1. Walk through onboarding to create the initial admin user.
2. After onboarding completes, enable multi-user mode:
   - In the UI: Settings -> Security -> Multi-User Mode -> enable, **or**
   - Via SQL:
     ```bash
     docker compose exec anythingllm sqlite3 /app/server/storage/anythingllm.db \
       "UPDATE system_settings SET value='true' WHERE label='multi_user_mode';"
     docker compose restart anythingllm
     ```
3. Create additional admin and default-role users via Settings -> Users. The live deployment has three accounts — two `admin` (`jeremy`, `nick`) and one `default` (`eric`). Document credentials in `~/.openclaw/anythingllm/UPGRADING.md` (which is gitignored).
4. Create the workspaces. The live deployment has two: **Z-Health Knowledge Base** (slug `zhealth_research`) and **General Chat** (slug `general-chat`).

---

## Z-Health corpus setup

The **Z-Health Knowledge Base** workspace does RAG against the Qdrant collection `zhealth_research`. That collection must hold the Z-Health corpus before the workspace is useful.

Provenance of the corpus: 41,041 vectors of zhealtheducation.com blog posts, podcast episode transcripts, and video transcripts (with speaker/timestamp metadata), embedded with the `nomic-embed-text` family, 768-dim. The canonical copy is the backup collection `zhealth_research_nomic` (41,041 points).

`zhealth_research` is populated from that backup using `docs/z-health/zh-corpus-copy.py`, which batch-copies all points from `zhealth_research_nomic` into `zhealth_research` additively (it does not disturb documents uploaded through the UI):

```bash
python3 ~/Projects/anything-llm/docs/z-health/zh-corpus-copy.py
```

After the copy, `zhealth_research` holds **41,048 points** — the 41,041-vector corpus plus the 7 working documents uploaded through the workspace UI. Verify:

```bash
curl -s http://localhost:6333/collections/zhealth_research | grep -o '"points_count":[0-9]*'
# expected: "points_count":41048
```

Both collections are 768-dim / Cosine. The workspace queries with the native `Xenova/nomic-embed-text-v1` model (same family, same vector space as the corpus's embedding model) — see `docs/z-health/COMMAND_GUIDE.md` for the corpus/RAG details.

---

## Recovering from issues

### `JWT_SECRET` missing or rotated

Symptom: login succeeds but every subsequent request returns 401, or logs show "Cannot create JWT" / "invalid signature". Cause: `JWT_SECRET` is unset or was changed.

Fix:

```bash
# Generate and set
echo "JWT_SECRET=$(openssl rand -hex 32)" >> ~/.openclaw/anythingllm/.env
cd ~/.openclaw/anythingllm && docker compose restart anythingllm
```

All active sessions are invalidated. Passwords are unaffected — users just need to log in again.

### React error #321 (Invalid hook call)

Symptom: white screen, console shows `Minified React error #321`. Cause: two React instances loaded into memory because some HTML referenced `/index.js?v=<stamp>` while the rest used `/index.js`.

Fix:
1. Inspect the served `index.html`: `curl -s http://localhost:3001/ | grep index.js`. The `<script>` tag must reference `/index.js` with **no query string**.
2. If there's a `?v=` stamp, find and remove the postbuild script or `MetaGenerator.js` change that added it. The fork's `MetaGenerator.js` patch (bind-mounted from `~/.openclaw/anythingllm/MetaGenerator.js`) emits the bare URL.
3. Verify the Cache-Control headers: `curl -I http://localhost:3001/index.js` should show `Cache-Control: no-cache, must-revalidate`. Hashed assets (e.g. `/index-a5168934.js`) get `public, max-age=31536000, immutable`.
4. Rebuild the frontend, restart the container, and hard-refresh in Incognito.

### Cache stuck on old assets

Symptom: code changes don't appear after `npm run build`. Cause: browser is serving the previous module graph from disk cache or service worker.

Fix:
- DevTools -> Application -> Storage -> Clear site data.
- Or test in a fresh Incognito window.
- Confirm `Cache-Control: no-cache` is set on `/index.js` and `/index.css` (see above).

### Embedding-engine mismatch

Symptom: workspace search returns no results or throws dimension errors. Cause: the embedding engine was switched (e.g. Ollama -> native) but old vectors in Qdrant use the previous dimensionality.

Fix: re-embed every document in every workspace. Full procedure in `~/.openclaw/anythingllm/UPGRADING.md` ("Re-embedding after embedding engine change").

### OpenClaw unreachable

Symptom: every chat returns "Could not respond to message". Cause: OpenClaw gateway isn't running or `GENERIC_OPEN_AI_BASE_PATH` is wrong.

Fix:
```bash
curl http://localhost:18789/health
# if this fails:
launchctl kickstart -k gui/$UID/com.openclaw.gateway
```

Inside the container, the gateway must be reachable as `host.docker.internal:18789`, not `localhost:18789`. Confirm with `docker compose exec anythingllm curl http://host.docker.internal:18789/health`.

---

## Day-2 operations

| Task | Where |
|---|---|
| Image upgrade | `~/.openclaw/anythingllm/UPGRADING.md` -> "Standard image upgrade" |
| Re-applying patches after image bump | `~/.openclaw/anythingllm/UPGRADING.md` -> "Custom overrides preserved across upgrades" |
| Re-embedding documents | `~/.openclaw/anythingllm/UPGRADING.md` -> "Re-embedding after embedding engine change" |
| Adding / editing a Z-Health agent flow | `~/.openclaw/anythingllm/storage/plugins/agent-flows/README.md` |
| Rotating secrets | [SECURITY.md](./SECURITY.md) |
| Rebasing on upstream (branch mechanics) | [UPGRADING.md](./UPGRADING.md) and [CONTRIBUTING.md](./CONTRIBUTING.md) |

---

## Sources & references

- Compose file and bind-mount definitions: `~/.openclaw/anythingllm/docker-compose.yml`.
- Live env vars verified against `docker exec anythingllm printenv` (image `mintplexlabs/anythingllm:1.12.1`).
- Z-Health corpus origin and the copy script: `docs/z-health/COMMAND_GUIDE.md`, `docs/z-health/zh-corpus-copy.py`.
- Patched files: `~/.openclaw/anythingllm/server-index.js`, `MetaGenerator.js`, `qdrant-provider.js`.
- Divergence baseline: AnythingLLM v1.12.1, commit `b1e5b6f`. See [docs/PROVENANCE.md](./docs/PROVENANCE.md).
