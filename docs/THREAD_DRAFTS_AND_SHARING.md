# Thread Drafts & Sharing

Database-backed drafts and per-thread sharing for the E4 fork. Replaces the localStorage-only draft system from `feature/message-draft-autosave` with a multi-user, multi-device system.

## Goals

1. **Drafts survive device switches** — type on your phone, finish on your laptop.
2. **Drafts survive provider errors** — if the LLM rejects a message, the typed text is still there to retry.
3. **Threads can be shared with specific users** — read or read+write, per recipient.
4. **Live presence on shared threads** — see when a collaborator is drafting a response.

---

## Data model

```sql
thread_drafts (
  id, thread_id, user_id, workspace_id,
  content TEXT,
  updatedAt
  UNIQUE(thread_id, user_id)
)

thread_shares (
  id, thread_id, shared_with_id, shared_by_id,
  permission TEXT DEFAULT 'read',  -- 'read' | 'write'
  createdAt
  UNIQUE(thread_id, shared_with_id)
)
```

Both tables cascade-delete with their parent thread. Drafts are one-per-user-per-thread; shares are one-per-recipient-per-thread.

Migration: `server/prisma/migrations/20260514170646_init/migration.sql`.

---

## Permission model

| Role | Permission | Can read messages | Can send messages | Can change sharing |
|---|---|---|---|---|
| Thread owner | implicit `write` | ✅ | ✅ | ✅ |
| Shared user — `write` | `write` | ✅ | ✅ | ❌ |
| Shared user — `read` | `read` | ✅ | ❌ (HTTP 403) | ❌ |
| Anyone else | none | ❌ (HTTP 404) | ❌ (HTTP 404) | ❌ (HTTP 404) |

The owner is the user whose `id` is on `workspace_threads.user_id`. There's no migration of the owner — sharing only adds collaborators.

---

## API

| Method & path | Body | Returns | Auth |
|---|---|---|---|
| `PUT /workspace/:slug/thread/:threadSlug/draft` | `{content}` | `{draft}` | thread owner OR write-shared |
| `GET /workspace/:slug/thread/:threadSlug/drafts` | — | `{drafts:[...], myUserId}` | thread owner OR any shared user |
| `DELETE /workspace/:slug/thread/:threadSlug/draft` | — | `204` | self (caller's own draft) |
| `PUT /workspace/:slug/thread/:threadSlug/shares` | `{shares:[{user_id,permission}]}` | `{shares}` | thread owner only |
| `GET /workspace/:slug/thread/:threadSlug/shares` | — | `{shares}` | thread owner OR any shared user |
| `GET /workspace/:slug/shareable-users` | — | `{users}` | workspace member |
| `GET /workspace/:slug/threads` (modified) | — | `{threads:[...]}` with `isOwner`, `isSharedWithMe`, `sharedBy`, `permission` flags | workspace member |
| `POST /workspace/:slug/thread/:threadSlug/stream-chat` (modified) | as before | as before, but `403` for read-only viewers | thread owner OR write-shared |

The shared `validSharedThread` middleware (`server/utils/middleware/validSharedThread.js`) sets `response.locals.thread` and `response.locals.permission` and is used by all the routes above. `requireWritePermission` is layered on top for write-only routes.

---

## Frontend

- `Workspace.threads.{saveDraft, getDrafts, clearDraft, setShares, getShares}` — API methods on the existing thread model object.
- `Workspace.getShareableUsers(slug)` — fetch the workspace user list for the share dialog.
- `usePromptInputStorage` hook (rewritten) — debounced 500ms PUT to the draft endpoint. Falls back to localStorage if the network fails. One-time migration of legacy localStorage drafts to the DB on first load, gated by an `e4_drafts_migrated` flag.
- `useDraftTimestamp(storageKey)` — unchanged interface; still reads from localStorage cache for fast UI updates, refreshed by the `e4DraftSync` custom event.
- `useThreadPresence(workspaceSlug, threadSlug)` — polls the drafts endpoint every 5s, returns the list of *other* users currently drafting. Pauses while the tab is hidden.
- `<ShareDialog>` modal — picks workspace users, per-user permission dropdown, replaces the full share list on save.
- Sidebar `ThreadItem`:
  - Owner sees a Share button → opens `ShareDialog`.
  - Recipient sees a "Shared by X" badge.
- `PromptInput`:
  - "Draft saved · just now" indicator (existing, unchanged).
  - "Eric is drafting…" presence indicator when another user has a recent draft.

---

## Migration behavior

On first load after the deploy that includes this feature, the hook checks `localStorage["e4_drafts_migrated"]`. If unset, it:

1. Reads the legacy `anythingllm_user_prompt_input_map` JSON.
2. For each thread-slug entry with non-empty text, calls `PUT /draft` to persist it to the DB.
3. Deletes those entries from localStorage.
4. Sets `e4_drafts_migrated = "1"`.

Workspace-slug-only drafts (typed before any thread exists) are *not* migrated — they stay in localStorage. Once a thread is created, the draft persists to DB normally.

---

## Limitations / known gotchas

- **No real-time updates without polling** — presence is 5-second polled, not WebSocket. Good enough for "Eric is drafting"; can be upgraded to SSE later if needed.
- **SQLite `createMany` not supported** — `ThreadShare.setShares` uses a `$transaction` of single `create` calls instead. Postgres builds could swap back to `createMany` for efficiency.
- **No notification on share** — recipients see the shared thread next time they fetch their thread list. No push/email yet.
- **Owner transfer not implemented** — if the original owner is deleted, their threads cascade-delete (and so do all drafts and shares).
- **Read-only UI** — server enforces the gate (HTTP 403). The frontend UI disables the send button when permission='read', but the server is the source of truth.
- **Single-user mode (no MUM)** — drafts use `user_id=0` as a sentinel. Sharing is a no-op since there's only one user.
- **Read-only users + drafts** — a read-only viewer's `PUT /draft` returns 403 (server correctly rejects). The frontend still attempts the call on mount, producing a harmless 403 in the browser console. Read-only users get localStorage-only drafts. Not a functional defect.
- **Presence polls on all threads** — `useThreadPresence` runs on every thread with a slug, even unshared private ones (always returns empty). Negligible load for small deployments; could be gated on share-existence later.

## Bugs found in QA and fixed

The feature went through a code review + edge-case + browser-UI testing pass. Two real bugs were caught and fixed:

1. **Share data loss on duplicate/invalid `user_id`** (HIGH) — `ThreadShare.setShares` ran `deleteMany` *outside* the `$transaction`. A failed recreate (duplicate user in the array, or a non-existent `user_id` hitting the FK) wiped every existing share with no rollback, and the endpoint returned HTTP 200. Fixed: de-dupe the incoming list by `user_id`, validate ids against the users table (skip unknowns), move `deleteMany` inside the transaction, and return 500 on `null`. Commit `5b3fa72`.

2. **Shared users couldn't read thread chat history** (HIGH) — `GET .../chats` used `validWorkspaceAndThreadSlug` (user-id filtered) → 404 for shared viewers; and `WorkspaceChats.where` filtered by the caller's id so even past the middleware they'd see an empty history. Fixed: use `validSharedThread`, and query history by the thread *owner's* `user_id`. Commit `45f7da8`.

Both were caught only because the QA pass tested destructive/cross-user paths, not just the happy path.

---

## Testing

Quick API smoke (assumes running locally on port 3001):

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/request-token -H "Content-Type: application/json" -d '{"username":"jeremy","password":"..."}' | jq -r .token)

# Write draft
curl -X PUT "http://localhost:3001/api/workspace/zhealth_research/thread/<slug>/draft" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"content":"hello"}'

# Share with user_id=3 as read-only
curl -X PUT "http://localhost:3001/api/workspace/zhealth_research/thread/<slug>/shares" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"shares":[{"user_id":3,"permission":"read"}]}'
```

UI smoke:
1. Login as jeremy, open a thread, type without sending. Refresh — text reappears (loaded from DB).
2. Open the same thread in an Incognito window logged in as jeremy. Same text appears.
3. Click the Share icon next to the thread → check Eric (read-only) → Save.
4. Login as eric — the thread appears in his sidebar with the "Shared by jeremy" badge.
5. Eric tries to send a message — gets blocked.
6. Jeremy upgrades Eric to read+write — Eric can now send.

---

## Sources & references

- Migration: `server/prisma/migrations/20260514170646_init/migration.sql` — creates `thread_drafts` and `thread_shares` (verified present; the latest migration in the fork's Prisma history).
- Prisma models: `server/prisma/schema.prisma` — `model thread_drafts` and `model thread_shares` (both with `onDelete: Cascade` on every FK, matching the doc).
- Feature commits on `e4/ui-customizations`: `f850ed5` (backend), `2a36755` (frontend), `a1e79fd` (`validSharedThread` middleware), `2487d70` (code-review fixes), `5b3fa72` and `45f7da8` (the two QA bug fixes).
- This is a fork-original feature — it has no upstream equivalent. It supersedes the localStorage-only autosave from `feature/message-draft-autosave` (upstream PR #5629 candidate).
- Live deployment is multi-user mode (`system_settings.multi_user_mode = 'true'`), so the single-user `user_id=0` sentinel path described above is dormant in production.
