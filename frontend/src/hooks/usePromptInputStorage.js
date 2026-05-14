import { USER_PROMPT_INPUT_MAP } from "@/utils/constants";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import debounce from "lodash.debounce";
import { safeJsonParse } from "@/utils/request";

/**
 * Synchronizes prompt input value with localStorage, scoped to the current thread.
 *
 * Persists unsent prompt text across page refreshes and navigation. Each thread/workspace maintains
 * its own draft state independently. Storage key is determined by thread slug (if in a thread) or
 * workspace slug (if in default chat).
 *
 * Storage format (stored under USER_PROMPT_INPUT_MAP key):
 * ```json
 * {
 *   "thread-slug": { "text": "user's draft message...", "savedAt": 1234567890 },
 *   "workspace-slug": { "text": "another draft message...", "savedAt": 1234567890 }
 * }
 * ```
 * Backwards-compatible: entries may still be plain strings from older versions.
 *
 * @param {Object} props
 * @param {string} props.promptInput - Current prompt input value to sync
 * @param {Function} props.setPromptInput - State setter function for prompt input
 * @returns {void}
 */

/**
 * Reads the text portion of a stored draft entry, handling both the legacy
 * plain-string format and the new `{text, savedAt}` object format.
 * @param {string|{text:string,savedAt:number|null}|undefined} entry
 * @returns {{text:string, savedAt:number|null}}
 */
function normalizeDraftEntry(entry) {
  if (!entry) return { text: "", savedAt: null };
  if (typeof entry === "string") return { text: entry, savedAt: null };
  return { text: entry.text ?? "", savedAt: entry.savedAt ?? null };
}

/**
 * Immediately clears the stored draft for a given thread/workspace key.
 * Used before state updates that may remount PromptInput to prevent
 * stale text from being restored.
 * @param {string} storageKey - thread slug or workspace slug
 */
export function clearPromptInputDraft(storageKey) {
  try {
    const map = safeJsonParse(localStorage.getItem(USER_PROMPT_INPUT_MAP), {});
    map[storageKey] = { text: "", savedAt: null };
    localStorage.setItem(USER_PROMPT_INPUT_MAP, JSON.stringify(map));
  } catch {}
}

/**
 * Immediately saves a draft value for a given thread/workspace key.
 * Used to restore a user's message after a provider error so they don't
 * lose their typed text when the LLM backend returns an abort/error response.
 * @param {string} storageKey - thread slug or workspace slug
 * @param {string} value - the message text to save as a draft
 */
export function savePromptInputDraft(storageKey, value) {
  try {
    const map = safeJsonParse(localStorage.getItem(USER_PROMPT_INPUT_MAP), {});
    map[storageKey] = { text: value, savedAt: Date.now() };
    localStorage.setItem(USER_PROMPT_INPUT_MAP, JSON.stringify(map));
  } catch {}
}

export default function usePromptInputStorage({ promptInput, setPromptInput }) {
  const { threadSlug = null, slug: workspaceSlug } = useParams();
  useEffect(() => {
    const serializedPromptInputMap =
      localStorage.getItem(USER_PROMPT_INPUT_MAP) || "{}";

    const promptInputMap = safeJsonParse(serializedPromptInputMap, {});

    const rawEntry = promptInputMap[threadSlug ?? workspaceSlug];
    const { text } = normalizeDraftEntry(rawEntry);
    if (text) {
      setPromptInput(text);
    }
  }, []);

  const debouncedWriteToStorage = useMemo(
    () =>
      debounce((value, slug) => {
        const serializedPromptInputMap =
          localStorage.getItem(USER_PROMPT_INPUT_MAP) || "{}";
        const promptInputMap = safeJsonParse(serializedPromptInputMap, {});
        promptInputMap[slug] = { text: value, savedAt: Date.now() };
        localStorage.setItem(
          USER_PROMPT_INPUT_MAP,
          JSON.stringify(promptInputMap)
        );
      }, 500),
    []
  );

  useEffect(() => {
    debouncedWriteToStorage(promptInput, threadSlug ?? workspaceSlug);

    return () => {
      debouncedWriteToStorage.cancel();
    };
  }, [promptInput, threadSlug, workspaceSlug, debouncedWriteToStorage]);
}

/**
 * Formats a timestamp into a human-readable relative time string.
 * @param {number|null} savedAt - Unix timestamp in milliseconds
 * @returns {string} e.g. "just now", "1 min ago", "5 min ago"
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
 * @param {string} storageKey - thread slug or workspace slug
 * @returns {{savedAt: number, relativeTime: string}|null}
 */
export function useDraftTimestamp(storageKey) {
  const [result, setResult] = useState(() => {
    try {
      const map = safeJsonParse(
        localStorage.getItem(USER_PROMPT_INPUT_MAP),
        {}
      );
      const { text, savedAt } = normalizeDraftEntry(map[storageKey]);
      if (!text || !savedAt) return null;
      return { savedAt, relativeTime: formatRelativeTime(savedAt) };
    } catch {
      return null;
    }
  });

  // Re-read from storage whenever the key changes (e.g. thread switch)
  useEffect(() => {
    function read() {
      try {
        const map = safeJsonParse(
          localStorage.getItem(USER_PROMPT_INPUT_MAP),
          {}
        );
        const { text, savedAt } = normalizeDraftEntry(map[storageKey]);
        if (!text || !savedAt) {
          setResult(null);
          return;
        }
        setResult({ savedAt, relativeTime: formatRelativeTime(savedAt) });
      } catch {
        setResult(null);
      }
    }

    read();

    // Refresh the relative-time label every 30 seconds
    const interval = setInterval(read, 30000);
    return () => clearInterval(interval);
  }, [storageKey]);

  // Re-read when localStorage changes (e.g. debounced write lands)
  useEffect(() => {
    function onStorage(e) {
      if (e.key !== USER_PROMPT_INPUT_MAP) return;
      try {
        const map = safeJsonParse(e.newValue, {});
        const { text, savedAt } = normalizeDraftEntry(map[storageKey]);
        if (!text || !savedAt) {
          setResult(null);
          return;
        }
        setResult({ savedAt, relativeTime: formatRelativeTime(savedAt) });
      } catch {
        setResult(null);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey]);

  return result;
}
