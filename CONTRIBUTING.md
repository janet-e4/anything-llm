# Contributing to the E4 Studios fork of AnythingLLM

This document describes how to work on the fork without breaking the production deployment at https://zhealth.lvbs.com or accidentally leaking secrets to the public GitHub repo.

If you are looking for the upstream contributing guide, see [Mintplex-Labs/anything-llm](https://github.com/Mintplex-Labs/anything-llm). The rules below are **in addition** to upstream conventions, not a replacement for them.

---

## Branch strategy

Three branches, each with a distinct role.

```
master                              (mirrors upstream, never edited directly)
  └─ feature/message-draft-autosave (upstream PR candidate, #5629)
        └─ e4/ui-customizations    (E4-private, only branch deployed)
```

- **`master`** — kept in sync with `upstream/master`. Do not commit here. Update with `git fetch upstream && git merge --ff-only upstream/master`.
- **`feature/<name>`** — for any change we want to send upstream as a PR. Branch off `master`. Keep the diff narrow, provider-agnostic, and free of E4 references.
- **`e4/ui-customizations`** — branch off the most recent feature branch (currently `feature/message-draft-autosave`). Everything that won't go upstream lives here: branding removal, telemetry hardcode, Z-Health agent flows, the display panel.

### Never commit

- `.env`, `.env.development`, `.env.local`
- OpenClaw bearer tokens / API keys (`OPENCLAW_KEY`, `GENERIC_OPEN_AI_API_KEY`, etc.)
- `JWT_SECRET` values or generated session keys
- `storage/comkey/`, `storage/push-notifications/`
- Anything under `~/.openclaw/anythingllm/.env` or `~/.cloudflared/`
- SQLite snapshots (`anythingllm.db`, `*.sqlite`, `*.sqlite-journal`)

`.gitignore` covers the standard cases, but new files that match these patterns should be reviewed before `git add`. Prefer staging specific paths (`git add path/to/file`) over `git add .`.

---

## Local development workflow

The fork's deployment model is "bind-mount the built frontend into the container", so there is **no Vite dev server** in the loop. The workflow is:

```bash
cd ~/Projects/anything-llm/frontend
npm install            # only needed when package.json changes
npm run build
```

Then either:

- Hard-refresh the browser at http://localhost:3001 (Cmd+Shift+R), **or**
- `cd ~/.openclaw/anythingllm && docker compose restart anythingllm` to be safe.

Always test in a fresh browser profile or Incognito window after a frontend change. Service workers and the cached module graph can otherwise mask real bugs.

### Backend changes

The container runs the published Mintplex image with two patched files bind-mounted on top:

- `~/.openclaw/anythingllm/server-index.js` → `/app/server/index.js` (Cache-Control, telemetry hardcode)
- `~/.openclaw/anythingllm/MetaGenerator.js` → `/app/server/utils/boot/MetaGenerator.js` (no `?v=` query stamp)
- `~/.openclaw/anythingllm/qdrant-provider.js` → `/app/server/utils/vectorDbProviders/qdrant/index.js`

Backend changes that need to ship to production should be:
1. Made in the fork under `server/` so the diff is reviewable in git.
2. Copied into the corresponding `~/.openclaw/anythingllm/*.js` bind-mount target.
3. Followed by `docker compose restart anythingllm`.

---

## What goes upstream vs. stays in the fork

| Type of change | Destination |
|---|---|
| Bug fix in upstream behavior | `feature/<name>` -> upstream PR |
| Provider-agnostic feature (works for any LLM backend) | `feature/<name>` -> upstream PR |
| Accessibility, i18n, perf improvement | `feature/<name>` -> upstream PR |
| Branding removal / Mintplex link removal | `e4/ui-customizations` only |
| Telemetry hardcode | `e4/ui-customizations` only |
| Z-Health agent flows / prompts | `e4/ui-customizations` + `~/.openclaw/anythingllm/storage/plugins/agent-flows/` |
| Display settings panel (opinionated, not upstream-friendly) | `e4/ui-customizations` only |
| Cache-Control header patch | `e4/ui-customizations` only (until proven upstream-acceptable) |

If you're unsure, ask: "Would Mintplex want this for every user?" If yes, make a feature branch. If it's only useful to E4 / Z-Health, put it on `e4/ui-customizations`.

---

## Avoiding the dual-React trap

**Never add `?v=<stamp>` (or any query string) to `/index.js`** in the served HTML.

ES modules treat `/index.js` and `/index.js?v=123` as **two distinct modules**. If a browser ever loads both (e.g. one from disk cache + one freshly stamped), you get two copies of React in memory and any hook call throws **Minified React error #321: Invalid hook call**. We hit this in production and it took several hours to diagnose.

**Correct approach** (already in place):
- `server/index.js` static middleware sets `Cache-Control: no-cache` for `/index.js` and `/index.css`, and `Cache-Control: public, max-age=31536000, immutable` for hashed assets like `/index-a5168934.js`.
- `MetaGenerator.js` emits `<script type="module" src="/index.js">` with no query string.

If you ever feel the urge to bust the cache with a query stamp, stop and check whether the Cache-Control headers are actually being sent by inspecting a response in DevTools. They are the cache-busting mechanism in this fork.

---

## Rebasing on upstream

When upstream lands changes we want, rebase from the bottom of the stack up:

```bash
cd ~/Projects/anything-llm
git fetch upstream

# 1. Fast-forward master
git checkout master
git merge --ff-only upstream/master

# 2. Rebase the feature branch onto new master
git checkout feature/message-draft-autosave
git rebase upstream/master
# Resolve conflicts. Expected hotspots:
#   frontend/src/hooks/usePromptInputStorage.js
#   frontend/src/components/WorkspaceChat/ChatContainer/index.jsx

# 3. Rebase the E4 branch onto the new feature branch
git checkout e4/ui-customizations
git rebase feature/message-draft-autosave
# Expected hotspots: anything Mintplex touched in
#   frontend/src/components/Sidebar
#   frontend/src/components/SettingsSidebar
#   frontend/src/pages/GeneralSettings
```

After rebasing:

```bash
cd ~/Projects/anything-llm/frontend && npm run build
cd ~/.openclaw/anythingllm && docker compose restart anythingllm
```

Verify in browser: log in, send a test message, check the display settings panel renders, confirm no Mintplex links have crept back in.

Force-push is required after a rebase (the branches are private to E4). Use `git push --force-with-lease` to avoid clobbering someone else's work:

```bash
git push --force-with-lease origin feature/message-draft-autosave
git push --force-with-lease origin e4/ui-customizations
```

---

## Commit message style

Follow Conventional Commits, with a scope that identifies where the change lives:

- `feat(PromptInput): ...` — upstream-bound feature work
- `fix(ChatContainer): ...` — upstream-bound bug fix
- `docs(e4): ...` — fork-only documentation
- `chore(e4): ...` — fork-only branding, config, or build tweaks

E4-only commits should generally use the `(e4)` scope so they're easy to identify when reviewing what would land upstream vs. what stays private.

---

## Reporting issues

- Bugs in upstream behavior: open an issue at https://github.com/Mintplex-Labs/anything-llm/issues
- Bugs in E4-specific behavior: email janet@e4lv.com (do not open public issues that reference Z-Health internals)
- Security issues: see [SECURITY.md](./SECURITY.md)
