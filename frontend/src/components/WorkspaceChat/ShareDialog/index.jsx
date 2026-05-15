import { useEffect, useState } from "react";
import { X } from "@phosphor-icons/react";
import Workspace from "@/models/workspace";
import showToast from "@/utils/toast";

/**
 * Modal dialog for sharing a thread with other workspace users.
 *
 * @param {Object} props
 * @param {string} props.workspaceSlug
 * @param {string} props.threadSlug
 * @param {string} props.threadName
 * @param {Function} props.onClose
 */
export default function ShareDialog({
  workspaceSlug,
  threadSlug,
  threadName,
  onClose,
}) {
  const [users, setUsers] = useState([]);
  const [currentShares, setCurrentShares] = useState({}); // {userId: 'read'|'write'}
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [shareable, existing] = await Promise.all([
        Workspace.getShareableUsers(workspaceSlug),
        Workspace.threads.getShares(workspaceSlug, threadSlug),
      ]);
      if (cancelled) return;
      setUsers(shareable);
      const map = {};
      existing.forEach((s) => {
        if (s?.shared_with?.id) map[s.shared_with.id] = s.permission;
      });
      setCurrentShares(map);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [workspaceSlug, threadSlug]);

  function toggleUser(userId) {
    setCurrentShares((prev) => {
      const next = { ...prev };
      if (next[userId]) delete next[userId];
      else next[userId] = "read";
      return next;
    });
  }

  function setPermission(userId, permission) {
    setCurrentShares((prev) => ({ ...prev, [userId]: permission }));
  }

  async function save() {
    setSaving(true);
    const shares = Object.entries(currentShares).map(
      ([user_id, permission]) => ({
        user_id: Number(user_id),
        permission,
      })
    );
    const result = await Workspace.threads.setShares(
      workspaceSlug,
      threadSlug,
      shares
    );
    if (result === null) {
      showToast("Failed to update shares", "error");
    } else {
      showToast("Sharing updated", "success");
      onClose();
    }
    setSaving(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-theme-bg-secondary rounded-lg shadow border-2 border-theme-modal-border w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-theme-modal-border">
          <h3 className="text-base font-semibold text-white">
            Share "{threadName}"
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:bg-zinc-700 rounded p-1"
            aria-label="Close share dialog"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <p className="text-zinc-400 text-sm">Loading…</p>
          ) : users.length === 0 ? (
            <p className="text-zinc-400 text-sm">
              No other users to share with.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between py-1"
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!currentShares[u.id]}
                      onChange={() => toggleUser(u.id)}
                    />
                    <span className="text-white text-sm">{u.username}</span>
                    <span className="text-zinc-500 text-xs">({u.role})</span>
                  </label>
                  {currentShares[u.id] && (
                    <select
                      value={currentShares[u.id]}
                      onChange={(e) => setPermission(u.id, e.target.value)}
                      className="bg-zinc-700 text-white text-xs rounded px-2 py-1"
                    >
                      <option value="read">Read</option>
                      <option value="write">Read &amp; write</option>
                    </select>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-theme-modal-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-white hover:bg-zinc-700 rounded text-sm"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || loading}
            className="px-4 py-2 bg-primary-button text-black rounded text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save sharing"}
          </button>
        </div>
      </div>
    </div>
  );
}
