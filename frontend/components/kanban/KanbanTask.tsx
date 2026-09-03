"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/hooks/useBoard";

type KanbanTaskProps = {
  task: Task;
  onDelete?: () => void;
};

export function KanbanTask({ task, onDelete }: KanbanTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group flex flex-col gap-1 rounded-lg border border-border bg-surface-2 p-3 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md ${
        isDragging ? "z-10 opacity-50" : ""
      } cursor-grab active:cursor-grabbing`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-text">{task.title}</p>
        {onDelete ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete task"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted opacity-0 transition-opacity hover:bg-danger/15 hover:text-danger group-hover:opacity-100"
          >
            ✕
          </button>
        ) : null}
      </div>
      <span className="truncate text-[9px] font-medium uppercase tracking-wider text-muted">
        drag to reorder
      </span>
    </div>
  );
}
