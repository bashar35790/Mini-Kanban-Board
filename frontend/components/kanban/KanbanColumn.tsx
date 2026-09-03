"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanTask } from "./KanbanTask";
import { AddTaskForm } from "./AddTaskForm";
import type { Column, Task } from "@/hooks/useBoard";

type KanbanColumnProps = {
  column: Column;
  canEdit: boolean;
  onDeleteColumn: () => void;
  onAddTask: (title: string, description?: string) => void;
  onDeleteTask: (task: Task) => void;
};

export function KanbanColumn({
  column,
  canEdit,
  onDeleteColumn,
  onAddTask,
  onDeleteTask,
}: KanbanColumnProps) {
  const [showAdd, setShowAdd] = useState(false);
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-card border bg-surface p-3 transition-colors duration-200 ${
        isOver ? "border-primary/60 ring-2 ring-primary/20" : "border-border"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-text">{column.title}</h3>
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
            {column.tasks.length}
          </span>
        </div>
        {canEdit ? (
          <button
            onClick={onDeleteColumn}
            aria-label={`Delete column ${column.title}`}
            className="flex h-6 w-6 items-center justify-center rounded text-muted transition-colors hover:bg-danger/15 hover:text-danger"
          >
            ✕
          </button>
        ) : null}
      </div>

      <SortableContext
        items={column.tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2">
          {column.tasks.map((task) => (
            <KanbanTask
              key={task.id}
              task={task}
              onDelete={canEdit ? () => onDeleteTask(task) : undefined}
            />
          ))}
          {column.tasks.length === 0 && !showAdd ? (
            <p className="py-4 text-center text-xs text-muted/50">Empty column</p>
          ) : null}
        </div>
      </SortableContext>

      {canEdit ? (
        showAdd ? (
          <AddTaskForm
            onCancel={() => setShowAdd(false)}
            onSubmit={(title, description) => {
              onAddTask(title, description);
              setShowAdd(false);
            }}
          />
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="mt-3 flex items-center justify-center gap-1 rounded-lg border border-dashed border-border py-2 text-sm text-muted transition-colors hover:border-primary/50 hover:text-primary"
          >
            + Add task
          </button>
        )
      ) : null}
    </div>
  );
}
