const prisma = require("../prisma");
const { userFromSession } = require("../http");

/**
 * Validates a thread by slug within the workspace on response.locals.
 * Unlike validWorkspaceAndThreadSlug, this also allows users with whom the
 * thread has been shared (via thread_shares) to pass.
 *
 * Sets response.locals.thread and response.locals.permission ('read' | 'write').
 *
 * Requires validWorkspaceSlug to run before this so response.locals.workspace is set.
 */
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
      where: {
        thread_id_shared_with_id: {
          thread_id: thread.id,
          shared_with_id: user.id,
        },
      },
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

/**
 * After validSharedThread, this middleware rejects requests with 403 if the
 * caller has only 'read' permission. Use this on routes that mutate state
 * (e.g. POST stream-chat).
 */
function requireWritePermission(request, response, next) {
  const permission = response.locals.permission;
  if (permission !== "write") {
    return response.status(403).json({
      error: "You have read-only access to this thread.",
    });
  }
  return next();
}

module.exports = { validSharedThread, requireWritePermission };
