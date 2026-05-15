const prisma = require("../utils/prisma");

const ThreadDraft = {
  upsertDraft: async function (threadId, userId, workspaceId, content) {
    try {
      const draft = await prisma.thread_drafts.upsert({
        where: { thread_id_user_id: { thread_id: threadId, user_id: userId } },
        update: { content, updatedAt: new Date() },
        create: {
          thread_id: threadId,
          user_id: userId,
          workspace_id: workspaceId,
          content,
        },
      });
      return draft;
    } catch (e) {
      console.error("ThreadDraft.upsertDraft", e.message);
      return null;
    }
  },

  getDraft: async function (threadId, userId) {
    try {
      return await prisma.thread_drafts.findUnique({
        where: { thread_id_user_id: { thread_id: threadId, user_id: userId } },
      });
    } catch (e) {
      console.error("ThreadDraft.getDraft", e.message);
      return null;
    }
  },

  getDraftsForThread: async function (threadId) {
    try {
      return await prisma.thread_drafts.findMany({
        where: { thread_id: threadId },
        include: { user: { select: { id: true, username: true, pfpFilename: true } } },
      });
    } catch (e) {
      console.error("ThreadDraft.getDraftsForThread", e.message);
      return [];
    }
  },

  clearDraft: async function (threadId, userId) {
    try {
      await prisma.thread_drafts.deleteMany({
        where: { thread_id: threadId, user_id: userId },
      });
      return true;
    } catch (e) {
      console.error("ThreadDraft.clearDraft", e.message);
      return false;
    }
  },
};

module.exports = { ThreadDraft };
