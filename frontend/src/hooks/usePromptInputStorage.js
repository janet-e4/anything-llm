import { USER_PROMPT_INPUT_MAP } from "@/utils/constants";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import debounce from "lodash.debounce";
import { safeJsonParse } from "@/utils/request";
import Workspace from "@/models/workspace";

/**
 * Synchronizes prompt input value with the server (DB-backed) for thread-scoped
 * drafts, falling back to localStorage when:
 * - We're not in a thread context (no threadSlug yet — workspace default chat).
 * - The API call fails (offline / server down).
 *
 * Per-user, per-thread drafts now live on the server so that they:
 * - Survive across browsers / devices.
 * - Become visible to other users with whom the thread is shared (presence).
 *
 * A one-time migration pushes any pre-existing localStorage drafts into the
 * DB on first mount per browser, then sets `e4_drafts_migrated=1`.
 */

const MIGRATION_FLAG = "e4_drafts_migrated";

/**
 * Reads the text portion of a stored draft entry, handling both the legacy
 * plain-string format and the `{text, savedAt}` object format.
 */
function normalizeDraftEntry(entry) {
  if (!entry) return { text: "", savedAt: null };
  if (typeof entry === "string") return { text: entry, savedAt: null };
  return { text: entry.text ?? "", savedAt: entry.savedAt ?? null };
}

function readLocalMap() {
  return safeJsonParse(localStorage.getItem(USER_PROMPT_INPUT_MAP), {}) || {};
}

function writeLocalEntry(key, text, savedAt) {
  if (!key) return;
  const map = readLocalMap();
  map[key] = { text, savedAt };
  localStorage.setItem(USER_PROMPT_INPUT_MAP, JSON.stringify(map));
}

/**
 * Immediately clears the stored draft for a given thread/workspace key.
 * Clears localStorage synchronously and fires-and-forgets nothing here because
 * we don't have the workspace slug context. The hook's mount-cleanup and the
 * debounced writer (which now writes an empty string) handle the API side.
 */
export function clearPromptInputDraft(storageKey) {
  try {
    writeLocalEntry(storageKey, "", null);
    window.dispatchEvent(new CustomEvent("e4DraftSync"));
  } catch {}
}

/**
 * Restore-on-error path. Saves to localStorage immediately; the hook's
 * debounced writer will push to the API on the next promptInput change.
 */
export function savePromptInputDraft(storageKey, value) {
  try {
    writeLocalEntry(storageKey, value, Date.now());
    window.dispatchEvent(new CustomEvent("e4DraftSync"));
  } catch {}
}

/**
 * One-time migration: push any existing localStorage draft for the current
 * thread up to the DB and remove it locally. Idempotent via MIGRATION_FLAG.
 */
async function migrateLocalDraftsToDb(workspaceSlug, threadSlug) {
  if (localStorage.getItem(MIGRATION_FLAG)) return;
  if (!workspaceSlug || !threadSlug) return;
  const map = readLocalMap();
  const { text } = normalizeDraftEntry(map[threadSlug]);
  if (text) {
    try {
      await Workspace.threads.saveDraft(workspaceSlug, threadSlug, text);
      delete map[threadSlug];
      localStorage.setItem(USER_PROMPT_INPUT_MAP, JSON.stringify(map));
    } catch {}
  }
  localStorage.setItem(MIGRATION_FLAG, "1");
}

/**
 * @param {Object} props
 * @param {string} props.promptInput - Current prompt input value to sync
 * @param {Function} props.setPromptInput - State setter function for prompt input
 * @returns {void}
 */
export default function usePromptInputStorage({ promptInput, setPromptInput }) {
  const { threadSlug = null, slug: workspaceSlug = null } = useParams();
  const storageKey = threadSlug ?? workspaceSlug;
  const initialLoadDone = useRef(false);

  // Mount: load from API (preferred) or fall back to localStorage.
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    let cancelled = false;
    async function loadInitial() {
      // Migrate first so we don't overwrite the just-pushed value with localStorage.
      await migrateLocalDraftsToDb(workspaceSlug, threadSlug);

      // API path: only when we have a thread context.
      if (workspaceSlug && threadSlug) {
        const { drafts, myUserId } = await Workspace.threads.getDrafts(
          workspaceSlug,
          threadSlug
        );
        if (cancelled) return;
        const own = drafts.find((d) => d.user_id === myUserId);
        if (own?.content) {
          setPromptInput(own.content);
          writeLocalEntry(
            storageKey,
            own.content,
            new Date(own.updatedAt).getTime()
          );
          window.dispatchEvent(new CustomEvent("e4DraftSync"));
          return;
        }
      }

      // Fall back to localStorage.
      const map = readLocalMap();
      const { text } = normalizeDraftEntry(map[storageKey]);
      if (text) setPromptInput(text);
    }
    loadInitial();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced write on every promptInput change: API + localStorage fallback.
  const debouncedWrite = useMemo(
    () =>
      debounce(async (value) => {
        if (!storageKey) return;
        writeLocalEntry(storageKey, value, Date.now());
        window.dispatchEvent(new CustomEvent("e4DraftSync"));
        if (workspaceSlug && threadSlug) {
          await Workspace.threads.saveDraft(workspaceSlug, threadSlug, value);
        }
      }, 500),
    [storageKey, workspaceSlug, threadSlug]
  );

  useEffect(() => {
    debouncedWrite(promptInput);
    return () => debouncedWrite.cancel();
  }, [promptInput, debouncedWrite]);
}

/**
 * Formats a timestamp into a human-readable relative time string.
 */
function formatRelativeTime(savedAt) {
  if (!savedAt) return null;
  const diffMs = Date.now() - savedAt;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin === 1) return "1 min ago";
  return `${diffMin} min ago`;
}

/**
 * Returns the saved-at timestamp and a relative time string for the current
 * thread/workspace draft. Updates every 30 seconds. Returns null when the
 * draft is empty or has never been saved.
 *
 * Listens to:
 * - `e4DraftSync` (in-tab custom event fired when the hook writes a draft)
 * - `storage` (cross-tab updates)
 *
 * @param {string} storageKey - thread slug or workspace slug
 * @returns {{savedAt: number, relativeTime: string}|null}
 */
export function useDraftTimestamp(storageKey) {
  const [result, setResult] = useState(() => {
    const map = readLocalMap();
    const { text, savedAt } = normalizeDraftEntry(map[storageKey]);
    if (!text || !savedAt) return null;
    return { savedAt, relativeTime: formatRelativeTime(savedAt) };
  });

  useEffect(() => {
    function read() {
      const map = readLocalMap();
      const { text, savedAt } = normalizeDraftEntry(map[storageKey]);
      if (!text || !savedAt) {
        setResult(null);
        return;
      }
      setResult({ savedAt, relativeTime: formatRelativeTime(savedAt) });
    }
    read();
    const interval = setInterval(read, 30000);
    const handler = () => read();
    window.addEventListener("e4DraftSync", handler);
    window.addEventListener("storage", handler);
    return () => {
      clearInterval(interval);
      window.removeEventListener("e4DraftSync", handler);
      window.removeEventListener("storage", handler);
    };
  }, [storageKey]);

  return result;
}
