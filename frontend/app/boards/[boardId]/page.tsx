"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useBoard } from "@/hooks/useBoard";
import {
  useMoveTask,
  useAddColumn,
  useDeleteColumn,
  useAddTask,
  useDeleteTask,
} from "@/hooks/useKanban";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { ShareBoardModal } from "@/components/boards/ShareBoardModal";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export default function BoardPage() {
  const params = useParams<{ boardId: string }>();
  const boardId = params.boardId;
  const router = useRouter();
  const { user, isPending: authPending, signOut } = useAuth();
  const { data, isPending, isError, error } = useBoard(boardId);

  const [shareOpen, setShareOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const moveTask = useMoveTask(boardId);
  const addColumn = useAddColumn(boardId);
  const deleteColumn = useDeleteColumn(boardId);
  const addTask = useAddTask(boardId);
  const deleteTask = useDeleteTask(boardId);

  if (authPending) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  const board = data?.board;
  const yourRole = data?.yourRole;
  const canEdit = yourRole === "EDITOR" || yourRole === "OWNER";
  const isOwner = yourRole === "OWNER";

  const handleDeleteColumn = async (columnId: string) => {
    if (
      deleteConfirm === columnId ||
      window.confirm("Delete this column and all its tasks?")
    ) {
      await deleteColumn.mutateAsync(columnId);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(columnId);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border bg-surface/50 px-6 py-4 backdrop-blur">
        <button
          onClick={() => router.push("/boards")}
          className="text-sm text-muted transition-colors hover:text-text"
        >
          ← Boards
        </button>

        <div className="flex flex-1 items-center justify-center gap-3 px-4">
          <h1 className="truncate text-lg font-semibold text-text">
            {board?.title ?? "…"}
          </h1>
          {yourRole ? (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isOwner
                  ? "bg-warning/15 text-warning"
                  : canEdit
                    ? "bg-primary/15 text-primary"
                    : "bg-muted/15 text-muted"
              }`}
            >
              {yourRole}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {isOwner ? (
            <Button size="sm" variant="secondary" onClick={() => setShareOpen(true)}>
              Share
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" onClick={async () => {
            await signOut();
            router.push("/login");
            router.refresh();
          }}>
            Sign out
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden p-6">
        {isPending ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
        ) : isError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <p className="max-w-sm text-danger">
              {(error as Error)?.message === "Not Found"
                ? "Board not found."
                : (error as Error)?.message ?? "Failed to load board"}
            </p>
            <Button
              variant="secondary"
              onClick={() => (error as Error)?.message === "Not Found" ? router.push("/boards") : router.refresh()}
            >
              {(error as Error)?.message === "Not Found" ? "Back to boards" : "Retry"}
            </Button>
          </div>
        ) : board ? (
          <KanbanBoard
            columns={board.columns}
            canEdit={canEdit}
            onMoveTask={moveTask.mutate}
            onAddColumn={addColumn.mutate}
            onDeleteColumn={handleDeleteColumn}
            onAddTask={(columnId, title, description) =>
              addTask.mutate({ columnId, title, description })
            }
            onDeleteTask={(task) => deleteTask.mutate(task.id)}
          />
        ) : null}
      </main>

      <ShareBoardModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        boardId={boardId}
        currentUserId={user?.id ?? ""}
      />
    </div>
  );
}