import { useEffect, useState, useRef } from "react";
import Workspace from "@/models/workspace";

const POLL_INTERVAL_MS = 5000;
const RECENT_THRESHOLD_MS = 60000; // "is drafting" if updatedAt within last 60s

/**
 * Polls drafts for a shared thread and returns OTHER users who are
 * actively drafting (their draft content is non-empty and updatedAt
 * is within RECENT_THRESHOLD_MS).
 *
 * Returns an array: [{ user: {id, username, pfpFilename}, content, updatedAt }, ...]
 * Excludes the caller's own draft.
 *
 * @param {string} workspaceSlug
 * @param {string} threadSlug
 * @param {boolean} enabled
 */
export default function useThreadPresence(
  workspaceSlug,
  threadSlug,
  enabled = true
) {
  const [presence, setPresence] = useState([]);
  const myUserIdRef = useRef(null);

  useEffect(() => {
    if (!enabled || !workspaceSlug || !threadSlug) {
      setPresence([]);
      return;
    }

    let cancelled = false;
    let timer = null;

    async function poll() {
      if (cancelled) return;
      if (document.hidden) {
        // Skip the network call while the tab is hidden but keep polling cadence.
        timer = setTimeout(poll, POLL_INTERVAL_MS);
        return;
      }
      const { drafts, myUserId } = await Workspace.threads.getDrafts(
        workspaceSlug,
        threadSlug
      );
      if (cancelled) return;
      if (myUserId) myUserIdRef.current = myUserId;
      const others = drafts.filter((d) => {
        if (myUserIdRef.current && d.user_id === myUserIdRef.current)
          return false;
        if (!d.content) return false;
        const age = Date.now() - new Date(d.updatedAt).getTime();
        return age < RECENT_THRESHOLD_MS;
      });
      setPresence(others);
      timer = setTimeout(poll, POLL_INTERVAL_MS);
    }
    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [workspaceSlug, threadSlug, enabled]);

  return presence;
}
