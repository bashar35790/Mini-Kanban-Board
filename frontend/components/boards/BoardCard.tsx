"use client";

import Link from "next/link";
import type { Board, BoardRole } from "@/hooks/useBoards";
import { Avatar } from "@/components/ui/Avatar";

const roleStyles: Record<BoardRole, string> = {
  OWNER: "bg-warning/15 text-warning",
  EDITOR: "bg-primary/15 text-primary",
  VIEWER: "bg-muted/15 text-muted",
};

const roleLabels: Record<BoardRole, string> = {
  OWNER: "Owner",
  EDITOR: "Editor",
  VIEWER: "Viewer",
};

type BoardCardProps = {
  board: Board;
  userName: string;
};

export function BoardCard({ board, userName }: BoardCardProps) {
  return (
    <Link
      href={`/boards/${board.id}`}
      className="group flex flex-col justify-between rounded-card border border-border bg-surface p-6 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
    >
      <div>
        <h3 className="mb-2 text-lg font-semibold text-text group-hover:text-white">
          {board.title}
        </h3>
        {board.description ? (
          <p className="mb-4 line-clamp-2 text-sm text-muted">{board.description}</p>
        ) : (
          <p className="mb-4 text-sm italic text-muted/50">No description</p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${roleStyles[board.role]}`}
        >
          {roleLabels[board.role]}
        </span>
        <Avatar name={userName} size="sm" />
      </div>
    </Link>
  );
}
