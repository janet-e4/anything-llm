-- CreateTable
CREATE TABLE "thread_drafts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "thread_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "workspace_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "thread_drafts_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "workspace_threads" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "thread_drafts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "thread_drafts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "thread_drafts_thread_id_user_id_key" ON "thread_drafts"("thread_id", "user_id");
CREATE INDEX "thread_drafts_thread_id_idx" ON "thread_drafts"("thread_id");
CREATE INDEX "thread_drafts_workspace_id_idx" ON "thread_drafts"("workspace_id");

-- CreateTable
CREATE TABLE "thread_shares" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "thread_id" INTEGER NOT NULL,
    "shared_with_id" INTEGER NOT NULL,
    "shared_by_id" INTEGER NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'read',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "thread_shares_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "workspace_threads" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "thread_shares_shared_with_id_fkey" FOREIGN KEY ("shared_with_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "thread_shares_shared_by_id_fkey" FOREIGN KEY ("shared_by_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "thread_shares_thread_id_shared_with_id_key" ON "thread_shares"("thread_id", "shared_with_id");
CREATE INDEX "thread_shares_thread_id_idx" ON "thread_shares"("thread_id");
CREATE INDEX "thread_shares_shared_with_id_idx" ON "thread_shares"("shared_with_id");
