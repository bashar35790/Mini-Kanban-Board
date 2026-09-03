"use client";

import type { Board } from "@/hooks/useBoards";
import { BoardCard } from "./BoardCard";

type BoardListProps = {
  boards: Board[];
  userName: string;
};

export function BoardList({ boards, userName }: BoardListProps) {
  if (boards.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-sm text-center">
          <div className="mb-4 text-5xl">📋</div>
          <h2 className="mb-2 text-xl font-semibold text-text">No boards yet</h2>
          <p className="text-sm text-muted">
            Create your first board to start organizing tasks with kanban.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {boards.map((board) => (
        <BoardCard key={board.id} board={board} userName={userName} />
      ))}
    </div>
  );
}
