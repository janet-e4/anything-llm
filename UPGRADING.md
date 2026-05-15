# Upgrading — Branch & Rebase Mechanics

This document covers the **git side** of keeping the fork current: how the branch
stack is structured and how to rebase it when an upstream security fix needs to
land. For the **deployment side** — Docker image bumps, re-extracting and
re-patching the bind-mounted server files, re-embedding the Qdrant corpus,
account management — see the deployment-specific runbook at
`~/.openclaw/anythingllm/UPGRADING.md`.

The two documents are complementary: do the branch work here first, then follow
the deployment runbook to ship the result.

---

## Why the fork pulls from upstream at all

The E4 fork is an **independent project**. It diverged from upstream AnythingLLM
at commit `b1e5b6f` (v1.12.1) and does **not** chase `upstream/master` for new
features. The only reason to pull from upstream is a **security fix**. The
decision of *whether* a given upstream change is a security fix worth taking is
made by the upstream-security-sync skill + agent (see
[SECURITY.md](./SECURITY.md#staying-current-with-upstream-security-fixes)). This
document assumes that decision has already been made and a rebase is needed.

---

## Branch stack

```
master                              (mirror of upstream/master, currently @ b1e5b6f)
  └─ feature/message-draft-autosave (upstream PR #5629 candidate, tip ec996ce)
        └─ e4/ui-customizations    (deployed branch, ~20 commits ahead of b1e5b6f)
```

- **`master`** — never edited directly. Fast-forwarded to `upstream/master`.
- **`feature/message-draft-autosave`** — the provider-error message-recovery
  change, kept narrow and provider-agnostic so it can be sent upstream as a PR.
- **`e4/ui-customizations`** — everything else: branding removal, telemetry-off,
  the display panel, the DB-backed thread drafts + sharing feature, and the
  Z-Health customizations. This is the only branch ever built and deployed.

---

## Rebase procedure

Run from `~/Projects/anything-llm`. Rebase from the bottom of the stack up.

```bash
git fetch upstream

# 1. Fast-forward master to the new upstream tip
git checkout master
git merge --ff-only upstream/master

# 2. Rebase the feature branch onto the new master
git checkout feature/message-draft-autosave
git rebase master
# Expected conflict hotspots:
#   frontend/src/hooks/usePromptInputStorage.js
#   frontend/src/components/WorkspaceChat/ChatContainer/index.jsx

# 3. Rebase the E4 branch onto the new feature branch
git checkout e4/ui-customizations
git rebase feature/message-draft-autosave
# Expected conflict hotspots — anything Mintplex touched in:
#   frontend/src/components/Sidebar
#   frontend/src/components/SettingsSidebar
#   frontend/src/pages/GeneralSettings
#   server/prisma/schema.prisma   (the thread_drafts / thread_shares models)
```

If the upstream fix added a Prisma migration, the fork's draft/share migration
(`server/prisma/migrations/20260514170646_init/`) must remain the **last**
migration in timestamp order. Reorder if necessary so `prisma migrate` applies
the upstream migration before the fork's.

---

## After a rebase

```bash
# Build the frontend
cd ~/Projects/anything-llm/frontend && npm run build

# Restart the deployed container (picks up the new frontend/dist bind mount)
cd ~/.openclaw/anythingllm && docker compose restart anythingllm
```

If the upstream fix touched `server/index.js` or
`server/utils/boot/MetaGenerator.js`, the patched bind-mounted copies in
`~/.openclaw/anythingllm/` must be regenerated — see
`~/.openclaw/anythingllm/UPGRADING.md` ("Custom overrides preserved across
upgrades"). A frontend-only fix needs only the `npm run build` + restart above.

Verify in the browser: log in, send a test message, confirm the display-settings
panel renders, confirm no Mintplex links have reappeared, confirm thread drafts
still save.

---

## Pushing

The branches are private to E4, so a rebase requires a force push. Use
`--force-with-lease` to avoid clobbering work:

```bash
git push --force-with-lease origin master
git push --force-with-lease origin feature/message-draft-autosave
git push --force-with-lease origin e4/ui-customizations
```

---

## Sources & references

- Divergence baseline: commit `b1e5b6f`, AnythingLLM v1.12.1.
- Branch strategy and what-goes-where: [CONTRIBUTING.md](./CONTRIBUTING.md).
- Security-fix monitoring and the sync skill: [SECURITY.md](./SECURITY.md).
- Deployment-side upgrade runbook: `~/.openclaw/anythingllm/UPGRADING.md`.
- Per-feature provenance: [docs/PROVENANCE.md](./docs/PROVENANCE.md).
