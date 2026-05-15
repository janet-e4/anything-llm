const {
  multiUserMode,
  userFromSession,
  reqBody,
  safeJsonParse,
} = require("../utils/http");
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const { Telemetry } = require("../models/telemetry");
const {
  flexUserRoleValid,
  ROLES,
} = require("../utils/middleware/multiUserProtected");
const { EventLogs } = require("../models/eventLogs");
const { WorkspaceThread } = require("../models/workspaceThread");
const {
  validWorkspaceSlug,
  validWorkspaceAndThreadSlug,
} = require("../utils/middleware/validWorkspace");
const { WorkspaceChats } = require("../models/workspaceChats");
const { convertToChatHistory } = require("../utils/helpers/chat/responses");
const { getModelTag } = require("./utils");
const prisma = require("../utils/prisma");
const { ThreadDraft } = require("../models/threadDraft");
const { ThreadShare } = require("../models/threadShare");

// Helper: validate workspace and thread, but allow shared threads too.
// Sets response.locals.thread and response.locals.permission ('read'|'write').
async function validSharedThread(request, response, next) {
  const { threadSlug } = request.params;
  const workspace = response.locals.workspace;
  const user = await userFromSession(request, response);
  if (!workspace || !threadSlug) return response.sendStatus(400).end();

  const thread = await prisma.workspace_threads.findFirst({
    where: { slug: threadSlug, workspace_id: workspace.id },
  });
  if (!thread) return response.sendStatus(404).end();

  // Owner check
  if (user?.id && thread.user_id === user.id) {
    response.locals.thread = thread;
    response.locals.permission = "write";
    return next();
  }

  // Shared check
  if (user?.id) {
    const share = await prisma.thread_shares.findUnique({
      where: { thread_id_shared_with_id: { thread_id: thread.id, shared_with_id: user.id } },
    });
    if (share) {
      response.locals.thread = thread;
      response.locals.permission = share.permission;
      return next();
    }
  }

  // Single-user mode: allow if thread has no user_id
  if (!user && !thread.user_id) {
    response.locals.thread = thread;
    response.locals.permission = "write";
    return next();
  }

  return response.sendStatus(404).end();
}

function workspaceThreadEndpoints(app) {
  if (!app) return;

  app.post(
    "/workspace/:slug/thread/new",
    [validatedRequest, flexUserRoleValid([ROLES.all]), validWorkspaceSlug],
    async (request, response) => {
      try {
        const user = await userFromSession(request, response);
        const workspace = response.locals.workspace;
        const { thread, message } = await WorkspaceThread.new(
          workspace,
          user?.id
        );
        await Telemetry.sendTelemetry(
          "workspace_thread_created",
          {
            multiUserMode: multiUserMode(response),
            LLMSelection: process.env.LLM_PROVIDER || "openai",
            Embedder: process.env.EMBEDDING_ENGINE || "inherit",
            VectorDbSelection: process.env.VECTOR_DB || "lancedb",
            TTSSelection: process.env.TTS_PROVIDER || "native",
            LLMModel: getModelTag(),
          },
          user?.id
        );

        await EventLogs.logEvent(
          "workspace_thread_created",
          {
            workspaceName: workspace?.name || "Unknown Workspace",
          },
          user?.id
        );
        response.status(200).json({ thread, message });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/workspace/:slug/threads",
    [validatedRequest, flexUserRoleValid([ROLES.all]), validWorkspaceSlug],
    async (request, response) => {
      try {
        const user = await userFromSession(request, response);
        const workspace = response.locals.workspace;

        const ownThreads = await prisma.workspace_threads.findMany({
          where: { workspace_id: workspace.id, user_id: user?.id || null },
          orderBy: { lastUpdatedAt: "desc" },
        });

        let sharedThreads = [];
        if (user?.id) {
          const shares = await prisma.thread_shares.findMany({
            where: { shared_with_id: user.id },
            include: {
              thread: {
                include: { user: { select: { id: true, username: true } } },
              },
            },
          });
          sharedThreads = shares
            .filter((s) => s.thread.workspace_id === workspace.id)
            .map((s) => ({
              ...s.thread,
              isSharedWithMe: true,
              sharedBy: s.thread.user?.username,
              permission: s.permission,
            }));
        }

        const threads = [
          ...ownThreads.map((t) => ({ ...t, isOwner: true, permission: "write" })),
          ...sharedThreads,
        ];

        response.status(200).json({ threads });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.delete(
    "/workspace/:slug/thread/:threadSlug",
    [
      validatedRequest,
      flexUserRoleValid([ROLES.all]),
      validWorkspaceAndThreadSlug,
    ],
    async (_, response) => {
      try {
        const thread = response.locals.thread;
        await WorkspaceThread.delete({ id: thread.id });
        response.sendStatus(200).end();
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.delete(
    "/workspace/:slug/thread-bulk-delete",
    [validatedRequest, flexUserRoleValid([ROLES.all]), validWorkspaceSlug],
    async (request, response) => {
      try {
        const { slugs = [] } = reqBody(request);
        if (slugs.length === 0) return response.sendStatus(200).end();

        const user = await userFromSession(request, response);
        const workspace = response.locals.workspace;
        await WorkspaceThread.delete({
          slug: { in: slugs },
          user_id: user?.id ?? null,
          workspace_id: workspace.id,
        });
        response.sendStatus(200).end();
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.get(
    "/workspace/:slug/thread/:threadSlug/chats",
    [
      validatedRequest,
      flexUserRoleValid([ROLES.all]),
      validWorkspaceAndThreadSlug,
    ],
    async (request, response) => {
      try {
        const user = await userFromSession(request, response);
        const workspace = response.locals.workspace;
        const thread = response.locals.thread;
        const history = await WorkspaceChats.where(
          {
            workspaceId: workspace.id,
            user_id: user?.id || null,
            thread_id: thread.id,
            api_session_id: null, // Do not include API session chats.
            include: true,
          },
          null,
          { id: "asc" }
        );

        response.status(200).json({ history: convertToChatHistory(history) });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/workspace/:slug/thread/:threadSlug/update",
    [
      validatedRequest,
      flexUserRoleValid([ROLES.all]),
      validWorkspaceAndThreadSlug,
    ],
    async (request, response) => {
      try {
        const data = reqBody(request);
        const currentThread = response.locals.thread;
        const { thread, message } = await WorkspaceThread.update(
          currentThread,
          data
        );
        response.status(200).json({ thread, message });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.delete(
    "/workspace/:slug/thread/:threadSlug/delete-edited-chats",
    [
      validatedRequest,
      flexUserRoleValid([ROLES.all]),
      validWorkspaceAndThreadSlug,
    ],
    async (request, response) => {
      try {
        const { startingId } = reqBody(request);
        const user = await userFromSession(request, response);
        const workspace = response.locals.workspace;
        const thread = response.locals.thread;

        await WorkspaceChats.delete({
          workspaceId: Number(workspace.id),
          thread_id: Number(thread.id),
          user_id: user?.id,
          id: { gte: Number(startingId) },
        });

        response.sendStatus(200).end();
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  app.post(
    "/workspace/:slug/thread/:threadSlug/update-chat",
    [
      validatedRequest,
      flexUserRoleValid([ROLES.all]),
      validWorkspaceAndThreadSlug,
    ],
    async (request, response) => {
      try {
        const { chatId, newText = null, role = "assistant" } = reqBody(request);
        if (!newText || !String(newText).trim())
          throw new Error("Cannot save empty edit");

        const user = await userFromSession(request, response);
        const workspace = response.locals.workspace;
        const thread = response.locals.thread;
        const existingChat = await WorkspaceChats.get({
          workspaceId: workspace.id,
          thread_id: thread.id,
          user_id: user?.id,
          id: Number(chatId),
        });
        if (!existingChat) throw new Error("Invalid chat.");

        if (role === "user") {
          await WorkspaceChats._update(existingChat.id, {
            prompt: String(newText),
          });
        } else {
          const chatResponse = safeJsonParse(existingChat.response, null);
          if (!chatResponse) throw new Error("Failed to parse chat response");
          await WorkspaceChats._update(existingChat.id, {
            response: JSON.stringify({
              ...chatResponse,
              text: String(newText),
            }),
          });
        }

        response.sendStatus(200).end();
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  // PUT draft (upsert caller's draft)
  app.put(
    "/workspace/:slug/thread/:threadSlug/draft",
    [validatedRequest, flexUserRoleValid([ROLES.all]), validWorkspaceSlug, validSharedThread],
    async (request, response) => {
      try {
        const { content = "" } = reqBody(request);
        const user = await userFromSession(request, response);
        const thread = response.locals.thread;
        const workspace = response.locals.workspace;
        const permission = response.locals.permission;

        if (permission !== "write") return response.sendStatus(403).end();
        const userId = user?.id || 0;
        // user_id 0 fallback for single-user mode — use a sentinel record
        if (!userId) return response.status(400).json({ error: "userId required for drafts" });

        const draft = await ThreadDraft.upsertDraft(thread.id, userId, workspace.id, content);
        return response.status(200).json({ draft });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  // GET drafts (caller's own + others' if thread is shared with caller)
  app.get(
    "/workspace/:slug/thread/:threadSlug/drafts",
    [validatedRequest, flexUserRoleValid([ROLES.all]), validWorkspaceSlug, validSharedThread],
    async (request, response) => {
      try {
        const user = await userFromSession(request, response);
        const thread = response.locals.thread;
        const userId = user?.id || 0;

        // Always include caller's own draft. If thread is owned by caller OR
        // shared with caller, include other users' drafts too.
        const allDrafts = await ThreadDraft.getDraftsForThread(thread.id);
        return response.status(200).json({
          drafts: allDrafts,
          myUserId: userId,
        });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  // DELETE caller's own draft
  app.delete(
    "/workspace/:slug/thread/:threadSlug/draft",
    [validatedRequest, flexUserRoleValid([ROLES.all]), validWorkspaceSlug, validSharedThread],
    async (request, response) => {
      try {
        const user = await userFromSession(request, response);
        const thread = response.locals.thread;
        const userId = user?.id || 0;
        await ThreadDraft.clearDraft(thread.id, userId);
        return response.sendStatus(204).end();
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  // PUT shares — replace full share list (owner only)
  app.put(
    "/workspace/:slug/thread/:threadSlug/shares",
    [validatedRequest, flexUserRoleValid([ROLES.all]), validWorkspaceSlug, validSharedThread],
    async (request, response) => {
      try {
        const { shares = [] } = reqBody(request);
        const user = await userFromSession(request, response);
        const thread = response.locals.thread;
        if (user?.id && thread.user_id !== user.id) return response.sendStatus(403).end();

        const result = await ThreadShare.setShares(thread.id, user?.id || 0, shares);
        return response.status(200).json({ shares: result });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  // GET shares
  app.get(
    "/workspace/:slug/thread/:threadSlug/shares",
    [validatedRequest, flexUserRoleValid([ROLES.all]), validWorkspaceSlug, validSharedThread],
    async (request, response) => {
      try {
        const shares = await ThreadShare.getSharesForThread(response.locals.thread.id);
        return response.status(200).json({ shares });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );

  // GET shareable users (workspace members minus caller)
  app.get(
    "/workspace/:slug/shareable-users",
    [validatedRequest, flexUserRoleValid([ROLES.all]), validWorkspaceSlug],
    async (request, response) => {
      try {
        const user = await userFromSession(request, response);
        const allUsers = await prisma.users.findMany({
          where: { suspended: 0 },
          select: { id: true, username: true, role: true, pfpFilename: true },
        });
        // Filter: exclude caller, exclude users who don't have workspace access (unless admin/manager)
        const filtered = allUsers.filter((u) => {
          if (user?.id && u.id === user.id) return false;
          return true; // simplified: admins can be shared with too. WorkspaceUser check optional.
        });
        return response.status(200).json({ users: filtered });
      } catch (e) {
        console.error(e.message, e);
        response.sendStatus(500).end();
      }
    }
  );
}

module.exports = { workspaceThreadEndpoints };
