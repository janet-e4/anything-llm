# Provenance & Sources

This document records where this fork came from, what was changed, why, and the
source of every non-trivial decision. It is the authoritative attribution and
change-origin record for the **E4 Studios fork** of AnythingLLM.

---

## 1. Origin

| | |
|---|---|
| This fork | https://github.com/janet-e4/anything-llm |
| Upstream project | AnythingLLM by Mintplex Labs — https://github.com/Mintplex-Labs/anything-llm |
| Upstream license | MIT (retained — see `LICENSE`) |
| Divergence commit | `b1e5b6f` — the fork's `master` branched here |
| Upstream version at divergence | AnythingLLM **v1.12.1** |
| Deployed | Docker, image `mintplexlabs/anythingllm:1.12.1`, container `anythingllm` |

The fork is maintained as an **independent project**. It does not take feature
updates from upstream. It tracks upstream only for security fixes, via the
process documented in `~/Desktop/anythingllm-fork-maintenance/` (a Claude Code
skill + agent) and summarized in `SECURITY.md`. The last-synced upstream commit
is recorded in `.upstream-sync` at the repo root.

---

## 2. Branch structure

```
master                              mirror of upstream/master (currently b1e5b6f)
  └─ feature/message-draft-autosave  upstream PR candidate — Mintplex-Labs/anything-llm PR #5629
        └─ e4/ui-customizations      the deployed branch; all E4-specific work
```

`feature/message-draft-autosave` holds the one change intended to go back to
upstream (a provider-error message-recovery fix). Everything else is fork-only
and lives on `e4/ui-customizations`.

---

## 3. Changes made in this fork, with sources

All commits below are on `e4/ui-customizations`, in order from the divergence
point `b1e5b6f`.

### Provider-error message recovery — `ec996ce`
Restores the user's typed message to the textarea after an LLM provider error,
instead of silently discarding it. **Source:** original work; submitted upstream
as Mintplex-Labs/anything-llm **PR #5629**. PR description archived at
`.github/pr-draft.md`.

### Display customization panel + social-link removal — `44ed8c5`
Replaced the upstream text-size menu with a 3-tab panel (text size, Google
Fonts, markdown/HTML render toggles). Removed GitHub/Docs/Discord icons from the
sidebar footer. **Source:** original work; requested by E4 Studios.

### Cache-Control headers — `908dfca`, `f57cf5a`
Added correct `Cache-Control` headers to the static file server so deploys
invalidate cleanly. **Source:** original work. `f57cf5a` reverts an earlier
`?v=` query-string cache-bust that caused React error #321 (dual React
instances) — see the lesson recorded in `~/.openclaw/anythingllm/UPGRADING.md`.

### Draft autosave timestamp indicator — `5c00f42`
A "Draft saved · just now" indicator on the prompt input. **Source:** original
work; precursor to the DB-backed draft feature below.

### Branding / telemetry removal — `146cf7d`, `c88c3f0`, `6d265dd`, `c3ff51a`
Removed Mintplex Labs / AnythingLLM branding, external links, the Community Hub,
and the anonymous-telemetry toggle; hardcoded `DISABLE_TELEMETRY` on the server;
set the product name to "Janet by E4 Studios"; updated package metadata.
**Source:** E4 Studios requirement — this is a private deployment.
`6d265dd` was a 98-file sweep reducing 851 brand references to 121 (the
remainder being internal identifiers, npm package names, and HuggingFace model
IDs that must not change). Internal `anythingllm_*` localStorage keys and config
keys were deliberately preserved to avoid breaking user data.

### DB-backed thread drafts + sharing — `f850ed5`, `2a36755`, `a1e79fd`, `2487d70`, `5b3fa72`, `45f7da8`
A new feature: drafts persist to the database (multi-device), and threads can be
shared with specific users at read or read+write permission. Adds the
`thread_drafts` and `thread_shares` tables (migration `20260514170646_init`),
the `validSharedThread` middleware, and draft/share API endpoints.
**Source:** original work; requested by E4 Studios. Two HIGH-severity bugs were
caught in QA and fixed (`5b3fa72` share data-loss, `45f7da8` shared-user chat
404) — see `docs/THREAD_DRAFTS_AND_SHARING.md`.

### Z-Health command system — `061e8ab`, `93f7a15`
A set of slash commands, an upgraded workspace system prompt, and three agent
flows that make the Z-Health workspace write in Dr. Eric Cobb's voice.
**Source:** distilled from Dr. Cobb's own feedback document,
`/Volumes/Creataiv/Backups/z-health-conversation-history-adjustments.md`
(his June 15 email + a derived prompt pack). The source doc is archived at
`docs/z-health/eric-cobb-voice-spec-source.md`. The slash presets and system
prompt live in the AnythingLLM database, not the repo; the deploy script
`docs/z-health/zh-commands-deploy.py` reproduces them.

---

## 4. Deployment-side artifacts (not in this repo)

Some of the fork's runtime configuration lives in the deployment, not in git.
Recorded here for traceability:

| Artifact | Location | Origin |
|---|---|---|
| Patched `server/index.js` | `~/.openclaw/anythingllm/server-index.js` (bind-mounted) | AnythingLLM v1.12.1 `server/index.js` + the Cache-Control / telemetry patches |
| Patched `MetaGenerator.js` | `~/.openclaw/anythingllm/MetaGenerator.js` (bind-mounted) | AnythingLLM v1.12.1 `utils/boot/MetaGenerator.js` + branding/title patches |
| Slash command presets | AnythingLLM DB `slash_command_presets` | Generated by `docs/z-health/zh-commands-deploy.py` |
| Z-Health workspace system prompt | AnythingLLM DB `workspaces.openAiPrompt` (id 1) | Generated by `docs/z-health/zh-commands-deploy.py` |
| 3 agent flows | `~/.openclaw/anythingllm/storage/plugins/agent-flows/zhealth-*.json` | Original work, voice spec from the NAS source doc above |

---

## 5. The Z-Health knowledge corpus

The Z-Health workspace's vector knowledge base — Qdrant collection
`zhealth_research`, **41,048 vectors** — has two distinct origins:

- **41,041 vectors** — the Z-Health content corpus: zhealtheducation.com blog
  posts, podcast episode transcripts, and video transcripts. Embedded with
  `nomic-embed-text` (768-dim) by a prior pipeline. Copied into the live
  collection on 2026-05-15 from the backup collection `zhealth_research_nomic`
  (which remains as an untouched backup) using `docs/z-health/zh-corpus-copy.py`.
- **7 vectors** — six working documents (draft emails, newsletter drafts)
  embedded through AnythingLLM's own pipeline with native
  `Xenova/nomic-embed-text-v1`.

Both embedding models are the `nomic-embed-text` family at 768 dimensions, so
queries from the workspace's native embedder retrieve the corpus correctly
(verified live).

---

## 6. Third-party components retained from upstream

The fork inherits AnythingLLM's full dependency tree and architecture. Notable
upstream-owned pieces kept as-is:

- npm packages under the `@mintplex-labs/*` scope (express-ws, piper-tts-web,
  bree, mdpdf) — kept; they are real dependencies.
- HuggingFace model IDs (`Xenova/nomic-embed-text-v1`, `Xenova/all-MiniLM-L6-v2`,
  `MintplexLabs/multilingual-e5-small`) — kept; renaming would break model loads.
- The AnythingLLM Prisma schema, Express server structure, and ViteJS/React
  frontend — the fork extends these, it does not replace them.

---

## 7. Document index

| Document | Purpose |
|---|---|
| `README.md` | Fork overview, branch structure, customizations |
| `CONTRIBUTING.md` | Branch strategy and development workflow |
| `DEPLOYMENT.md` | From-scratch deployment runbook |
| `SECURITY.md` | Secret inventory, security posture, upstream-sync policy |
| `UPGRADING.md` | Branch/rebase upgrade mechanics |
| `docs/PROVENANCE.md` | This document — origin and sources |
| `docs/THREAD_DRAFTS_AND_SHARING.md` | The DB drafts + sharing feature |
| `docs/z-health/COMMAND_GUIDE.md` | The Z-Health slash command system |
| `docs/z-health/eric-cobb-voice-spec-source.md` | Archived source feedback doc |
| `~/.openclaw/anythingllm/UPGRADING.md` | Live-deployment upgrade specifics |
| `~/Desktop/anythingllm-fork-maintenance/` | Upstream-security-sync skill + agent |

---

*Created 2026-05-15, when the fork was formally designated an independent
project. Update this document whenever a new feature lands or an upstream
security sync is performed.*
