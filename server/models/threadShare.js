const prisma = require("../utils/prisma");

const ThreadShare = {
  /**
   * Replace the full share list for a thread.
   * shareList: [{ user_id, permission }]
   *
   * The delete + recreate happen inside ONE $transaction so that if any
   * create fails (duplicate user, FK violation) the whole operation rolls
   * back and the pre-existing shares are preserved. The incoming list is
   * de-duplicated by user_id and validated against the users table first.
   *
   * @returns {Array|null} the new share list, or null on failure.
   */
  setShares: async function (threadId, sharedById, shareList = []) {
    try {
      // De-dupe by user_id — last permission for a given user wins.
      const byUser = new Map();
      for (const s of Array.isArray(shareList) ? shareList : []) {
        const uid = Number(s?.user_id);
        if (!Number.isInteger(uid) || uid <= 0) continue;
        byUser.set(uid, s?.permission === "write" ? "write" : "read");
      }

      // Validate that every target user actually exists — skip unknown ids
      // rather than letting an FK violation abort the whole transaction.
      let validUserIds = [];
      if (byUser.size > 0) {
        const existing = await prisma.users.findMany({
          where: { id: { in: Array.from(byUser.keys()) } },
          select: { id: true },
        });
        validUserIds = existing.map((u) => u.id);
      }

      const rows = validUserIds.map((uid) => ({
        thread_id: threadId,
        shared_with_id: uid,
        shared_by_id: sharedById,
        permission: byUser.get(uid),
      }));

      // Atomic: delete-all + recreate in a single transaction. If a create
      // fails, the delete rolls back too — no data loss.
      await prisma.$transaction([
        prisma.thread_shares.deleteMany({ where: { thread_id: threadId } }),
        ...rows.map((data) => prisma.thread_shares.create({ data })),
      ]);

      return await this.getSharesForThread(threadId);
    } catch (e) {
      console.error("ThreadShare.setShares", e.message);
      return null;
    }
  },

  getSharesForThread: async function (threadId) {
    try {
      return await prisma.thread_shares.findMany({
        where: { thread_id: threadId },
        include: {
          shared_with: { select: { id: true, username: true, pfpFilename: true } },
          shared_by: { select: { id: true, username: true } },
        },
      });
    } catch (e) {
      console.error("ThreadShare.getSharesForThread", e.message);
      return [];
    }
  },

  getThreadsSharedWithUser: async function (userId, workspaceId = null) {
    try {
      const where = { shared_with_id: userId };
      const shares = await prisma.thread_shares.findMany({
        where,
        include: {
          thread: {
            include: {
              user: { select: { id: true, username: true } },
            },
          },
        },
      });
      // Filter to specified workspace if provided
      const filtered = workspaceId
        ? shares.filter((s) => s.thread.workspace_id === workspaceId)
        : shares;
      return filtered;
    } catch (e) {
      console.error("ThreadShare.getThreadsSharedWithUser", e.message);
      return [];
    }
  },

  removeShare: async function (threadId, sharedWithId) {
    try {
      await prisma.thread_shares.deleteMany({
        where: { thread_id: threadId, shared_with_id: sharedWithId },
      });
      return true;
    } catch (e) {
      console.error("ThreadShare.removeShare", e.message);
      return false;
    }
  },

  /**
   * Returns permission ('read' | 'write') if user has access, null otherwise.
   * Owner of the thread is implicitly 'write'.
   */
  getUserPermission: async function (threadId, userId) {
    try {
      // Check if user is the owner
      const thread = await prisma.workspace_threads.findUnique({
        where: { id: threadId },
        select: { user_id: true },
      });
      if (!thread) return null;
      if (thread.user_id === userId) return "write";

      // Otherwise check shares
      const share = await prisma.thread_shares.findUnique({
        where: {
          thread_id_shared_with_id: { thread_id: threadId, shared_with_id: userId },
        },
      });
      return share?.permission || null;
    } catch (e) {
      console.error("ThreadShare.getUserPermission", e.message);
      return null;
    }
  },
};

module.exports = { ThreadShare };
