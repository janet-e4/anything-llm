# Deployment Runbook — E4 Studios fork of AnythingLLM

From-scratch instructions for bringing up the fork on a new machine. The production deployment lives at `~/.openclaw/anythingllm/` and is exposed publicly at https://zhealth.lvbs.com via a Cloudflare tunnel.

For ongoing upgrade work (image bumps, re-embedding, override re-application) see `~/.openclaw/anythingllm/UPGRADING.md`.

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

Copy or edit `~/.openclaw/anythingllm/.env`. The required variables are:

```bash
# Auth
JWT_SECRET=<64-hex-char string>            # openssl rand -hex 32
SIG_KEY=<random>
SIG_SALT=<random>

# Telemetry off (defense in depth alongside the server/index.js hardcode)
DISABLE_TELEMETRY=true

# LLM provider — OpenClaw via generic-openai
LLM_PROVIDER=generic-openai
GENERIC_OPEN_AI_BASE_PATH=http://host.docker.internal:18789/v1
GENERIC_OPEN_AI_MODEL_PREF=openclaw
GENERIC_OPEN_AI_API_KEY=<openclaw bearer token from ~/.openclaw/openclaw.json>
GENERIC_OPEN_AI_MAX_TOKENS=8192

# Embeddings — native in-container Xenova/nomic-embed-text-v1
EMBEDDING_ENGINE=native

# Vector DB — Qdrant on host
VECTOR_DB=qdrant
QDRANT_ENDPOINT=http://host.docker.internal:6333

# Storage location
STORAGE_DIR=/app/server/storage
```

Generate fresh secrets if this is a brand-new deployment:

```bash
echo "JWT_SECRET=$(openssl rand -hex 32)" >> ~/.openclaw/anythingllm/.env
echo "SIG_KEY=$(openssl rand -hex 32)" >> ~/.openclaw/anythingllm/.env
echo "SIG_SALT=$(openssl rand -hex 32)" >> ~/.openclaw/anythingllm/.env
```

Never commit this file. See [SECURITY.md](./SECURITY.md) for the complete secret inventory.

### 5. Start the container

```bash
cd ~/.openclaw/anythingllm
docker compose up -d
docker compose logs -f anythingllm
```

The compose file bind-mounts the patched files described in [CONTRIBUTING.md](./CONTRIBUTING.md) plus `~/Projects/anything-llm/frontend/dist` -> `/app/server/public`.

### 6. Verify

```bash
curl http://localhost:3001/api/ping
# expected: {"online":true}
```

Then open http://localhost:3001 in a browser. If the page loads but the UI is broken, see "Recovering from issues" below.

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
3. Create additional admin and default-role users via Settings -> Users. Document credentials in `~/.openclaw/anythingllm/UPGRADING.md` (which is gitignored).

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
3. Verify the Cache-Control headers: `curl -I http://localhost:3001/index.js` should show `Cache-Control: no-cache`.
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
| Rebasing on upstream | [CONTRIBUTING.md](./CONTRIBUTING.md) |
